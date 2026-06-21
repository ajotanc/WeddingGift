import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
	// 1. Parse deleted user payload
	let deletedUser = {};
	if (typeof req.body === "string") {
		try {
			deletedUser = JSON.parse(req.body);
		} catch (err) {
			error("Payload JSON inválido");
			return res.json({ error: "Payload inválido" }, 400);
		}
	} else if (typeof req.body === "object" && req.body !== null) {
		deletedUser = req.body;
	}

	const userId = deletedUser.$id;
	if (!userId) {
		error("ID do usuário ausente no payload");
		return res.json({ error: "ID do usuário ausente" }, 400);
	}

	log(`Iniciando exclusão em cascata para o usuário: ${userId}`);

	// 2. Inicializa o SDK do Appwrite Server
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(
			process.env.APPWRITE_API_KEY || req.headers["x-appwrite-key"] || "",
		);
	const databases = new Databases(client);

	const DATABASE_ID = process.env.DATABASE_ID || "6a2cb37d0034ac2b40c6";
	const TABLE_TENANTS = "tenants";
	const TABLE_RSVPS = "rsvps";
	const TABLE_MESSAGES = "messages";
	const TABLE_PURCHASES = "purchases";
	const TABLE_GUESTS = "guests";

	try {
		// A. Se o usuário for um Tenant (casal), exclui o registro do tenant.
		// A exclusão do tenant causará a exclusão em cascata automática de faqs, produtos, etc.
		try {
			log(
				`Tentando excluir tenant correspondente ao ID do casal: ${userId}...`,
			);
			await databases.deleteDocument(DATABASE_ID, TABLE_TENANTS, userId);
			log(`Tenant ${userId} excluído com sucesso.`);
		} catch (err) {
			// Se retornar 404, significa que o usuário não era um casal (era apenas um convidado), ignoramos.
			log(
				`O usuário não era um casal ou o tenant já foi removido: ${err.message}`,
			);
		}

		// B. Se o usuário for um Convidado, remove o registro de convidado
		try {
			log(`Tentando excluir perfil do convidado: ${userId}...`);
			await databases.deleteDocument(DATABASE_ID, TABLE_GUESTS, userId);
			log(`Perfil do convidado ${userId} excluído.`);
		} catch (err) {
			log(`Perfil do convidado não encontrado ou já removido: ${err.message}`);
		}

		// C. Remove RSVPs atrelados a este convidado
		try {
			log(`Buscando RSVPs para o convidado ${userId}...`);
			const rsvpList = await databases.listDocuments(DATABASE_ID, TABLE_RSVPS, [
				Query.equal("guest", userId),
			]);
			for (const doc of rsvpList.documents) {
				await databases.deleteDocument(DATABASE_ID, TABLE_RSVPS, doc.$id);
				log(`RSVP ${doc.$id} excluído.`);
			}
		} catch (err) {
			error(`Erro ao remover RSVPs do convidado: ${err.message}`);
		}

		// D. Remove Mensagens atreladas a este convidado
		try {
			log(`Buscando mensagens para o convidado ${userId}...`);
			const msgList = await databases.listDocuments(
				DATABASE_ID,
				TABLE_MESSAGES,
				[Query.equal("guest", userId)],
			);
			for (const doc of msgList.documents) {
				await databases.deleteDocument(DATABASE_ID, TABLE_MESSAGES, doc.$id);
				log(`Mensagem ${doc.$id} excluída.`);
			}
		} catch (err) {
			error(`Erro ao remover mensagens do convidado: ${err.message}`);
		}

		// E. Remove Compras de presentes (Purchases) atreladas a este convidado
		try {
			log(`Buscando compras de presentes para o convidado ${userId}...`);
			const purchaseList = await databases.listDocuments(
				DATABASE_ID,
				TABLE_PURCHASES,
				[Query.equal("guest", userId)],
			);
			for (const doc of purchaseList.documents) {
				await databases.deleteDocument(DATABASE_ID, TABLE_PURCHASES, doc.$id);
				log(`Compra ${doc.$id} excluída.`);
			}
		} catch (err) {
			error(`Erro ao remover compras do convidado: ${err.message}`);
		}

		log(`Processo de cascade delete concluído para o usuário ${userId}.`);
		return res.json({ message: "Cascade delete concluído com sucesso" }, 200);
	} catch (err) {
		error(`Erro crítico no processamento de cascade delete: ${err.message}`);
		return res.json({ error: err.message }, 500);
	}
};
