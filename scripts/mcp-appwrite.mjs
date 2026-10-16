// Inicia o servidor MCP do Appwrite com as credenciais do `.env` do projeto, para o `.mcp.json` ficar no git sem chave.
// Usa VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID e APPWRITE_API_KEY (a mesma chave do scripts/migrate-security.mjs).
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../.env", import.meta.url));
if (!existsSync(file)) {
	console.error("Falta o .env na raiz do projeto.");
	process.exit(1);
}

const env = Object.fromEntries(
	readFileSync(file, "utf8")
		.split(/\r?\n/)
		.filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
		.map((l) => [
			l.slice(0, l.indexOf("=")).trim(),
			l.slice(l.indexOf("=") + 1).trim(),
		]),
);

const missing = [
	"VITE_APPWRITE_ENDPOINT",
	"VITE_APPWRITE_PROJECT_ID",
	"APPWRITE_API_KEY",
].filter((key) => !env[key]);
if (missing.length) {
	console.error(`Faltam no .env: ${missing.join(", ")}`);
	process.exit(1);
}

const child = spawn("uvx", ["mcp-server-appwrite@latest"], {
	stdio: "inherit",
	env: {
		...process.env,
		APPWRITE_ENDPOINT: env.VITE_APPWRITE_ENDPOINT,
		APPWRITE_PROJECT_ID: env.VITE_APPWRITE_PROJECT_ID,
		APPWRITE_API_KEY: env.APPWRITE_API_KEY,
	},
});
child.on("exit", (code) => process.exit(code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
