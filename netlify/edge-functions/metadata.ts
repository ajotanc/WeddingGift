import { Context } from "@netlify/edge-functions";
import { Client, Databases, Query } from "https://deno.land/x/appwrite/mod.ts";

const cleanHtml = (html: string) => {
	if (!html) return "";

	return html
		.replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/\n\s*\n/g, "\n")
		.trim();
};

export default async (request: Request, context: Context) => {
	const url = new URL(request.url);
	const pathSegments = url.pathname.split("/").filter(Boolean);
	const slug = pathSegments[0];

	// Ignora se não houver slug, se for a página inicial, ou se for rota padrão
	const standardPages = ["login", "register", "terms", "privacy", "admin"];
	if (!slug || standardPages.includes(slug)) {
		return context.next();
	}

	// Não intercepta arquivos e assets estáticos que possuem ponto (ex: .js, .css)
	if (url.pathname.includes(".")) {
		return context.next();
	}

	const ENDPOINT = Netlify.env.get("VITE_APPWRITE_ENDPOINT");
	const PROJECT_ID = Netlify.env.get("VITE_APPWRITE_PROJECT_ID");
	const DATABASE_ID = Netlify.env.get("VITE_APPWRITE_DATABASE_ID");
	const PROJECT_NAME = Netlify.env.get("VITE_PROJECT_NAME");
	const TABLE_ID = "tenants";

	if (!ENDPOINT || !PROJECT_ID || !DATABASE_ID) {
		return context.next();
	}

	try {
		const client = new Client();
		client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);

		const databases = new Databases(client);

		// Faz a busca pelo slug na tabela de tenants
		const response = await databases.listDocuments(DATABASE_ID, TABLE_ID, [
			Query.equal("slug", slug),
		]);

		const tenant = response.documents[0];

		// Se não encontrou nenhum casamento com esse slug, continua normalmente
		if (!tenant) return context.next();

		const originalResponse = await context.next();
		const contentType = originalResponse.headers.get("content-type");

		if (!contentType?.includes("text/html")) return originalResponse;

		const html = await originalResponse.text();

		// Define as tags baseadas nos dados do tenant
		const title = `${tenant.couple_name} · ${PROJECT_NAME}`;
		const description = cleanHtml(tenant.couple_history) || tenant.quote;
		const image =
			tenant.logo_url ||
			tenant.background_image ||
			`${url.origin}/pwa-512x512.png`;

		console.log(title, description, image);

		const metaTags = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${title}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${request.url}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
    `;

		// Remove as tags base do index.html para não duplicar
		const newHtml = html
			.replace(/<title>.*?<\/title>/g, "")
			.replace(/<meta property="og:.*?" \/>/g, "")
			.replace(/<meta name="twitter:.*?" \/>/g, "")
			.replace(/<meta name="description" content=".*?" \/>/g, "");

		const customHtml = newHtml.replace("</head>", `${metaTags}</head>`);

		return new Response(customHtml, {
			headers: { "content-type": "text/html; charset=UTF-8" },
		});
	} catch (error) {
		console.error("Erro na Edge Function:", error);
		return context.next();
	}
};

export const config = {
	path: "/*",
	excludedPath: ["/assets/*", "/*.svg", "/*.png", "/*.ico"],
};
