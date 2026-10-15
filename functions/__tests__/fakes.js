// Dublês em memória dos serviços do node-appwrite usados pelas Functions.

export class AppwriteError extends Error {
	constructor(message, code) {
		super(message);
		this.code = code;
	}
}

export function createDatabases(seed = {}) {
	const data = new Map();
	for (const [collection, docs] of Object.entries(seed)) {
		data.set(collection, new Map(docs.map((d) => [d.$id, structuredClone(d)])));
	}
	const col = (name) => {
		if (!data.has(name)) data.set(name, new Map());
		return data.get(name);
	};

	return {
		data,
		all: (name) => [...col(name).values()],
		async getDocument(_db, collection, id) {
			const doc = col(collection).get(id);
			if (!doc) throw new AppwriteError("Document not found", 404);
			return structuredClone(doc);
		},
		async createDocument(_db, collection, id, payload, permissions = []) {
			if (col(collection).has(id)) throw new AppwriteError("Document already exists", 409);
			const doc = { $id: id, ...payload, $permissions: permissions };
			col(collection).set(id, doc);
			return structuredClone(doc);
		},
		async updateDocument(_db, collection, id, payload = {}, permissions) {
			const doc = col(collection).get(id);
			if (!doc) throw new AppwriteError("Document not found", 404);
			Object.assign(doc, payload);
			if (permissions) doc.$permissions = permissions;
			return structuredClone(doc);
		},
		async deleteDocument(_db, collection, id) {
			if (!col(collection).delete(id)) throw new AppwriteError("Document not found", 404);
		},
		async listDocuments(_db, collection, queries = []) {
			let docs = [...col(collection).values()];
			for (const q of queries) {
				const parsed = JSON.parse(q);
				if (parsed.method === "equal") {
					docs = docs.filter((d) => parsed.values.includes(d[parsed.attribute]));
				}
			}
			return { total: docs.length, documents: docs.map((d) => structuredClone(d)) };
		},
	};
}

export function createUsers(list = []) {
	const users = new Map(list.map((u) => [u.$id, u]));
	return {
		async get(id) {
			const user = users.get(id);
			if (!user) throw new AppwriteError("User not found", 404);
			return user;
		},
		async list(queries = []) {
			let result = [...users.values()];
			for (const q of queries) {
				const parsed = JSON.parse(q);
				if (parsed.method === "equal") {
					result = result.filter((u) => parsed.values.includes(u[parsed.attribute]));
				}
			}
			return { total: result.length, users: result };
		},
	};
}

export function createTeams(seed = {}) {
	const teams = new Map();
	for (const [teamId, members] of Object.entries(seed)) {
		teams.set(teamId, members.map((userId, i) => ({ $id: `m${i}-${userId}`, userId })));
	}
	let seq = 0;
	return {
		teams,
		members: (teamId) => (teams.get(teamId) || []).map((m) => m.userId),
		async get(teamId) {
			if (!teams.has(teamId)) throw new AppwriteError("Team not found", 404);
			return { $id: teamId };
		},
		async create(teamId) {
			if (teams.has(teamId)) throw new AppwriteError("Team already exists", 409);
			teams.set(teamId, []);
			return { $id: teamId };
		},
		async listMemberships(teamId) {
			return { memberships: [...(teams.get(teamId) || [])] };
		},
		async createMembership(teamId, _roles, _email, userId) {
			const membership = { $id: `new${seq++}`, userId };
			teams.get(teamId).push(membership);
			return membership;
		},
		async deleteMembership(teamId, membershipId) {
			teams.set(
				teamId,
				teams.get(teamId).filter((m) => m.$id !== membershipId),
			);
		},
	};
}

/** Contexto { req, res, log, error } no formato das Functions do Appwrite. */
export function createContext({ body, userId, method = "POST", headers = {}, query = {} } = {}) {
	const req = {
		method,
		bodyRaw: body === undefined ? "" : typeof body === "string" ? body : JSON.stringify(body),
		headers: { ...(userId ? { "x-appwrite-user-id": userId } : {}), ...headers },
		query,
	};
	const res = {
		json: (data, status = 200) => ({ status, data }),
	};
	return { req, res, log: () => {}, error: () => {} };
}

/** fetch falso que responde por rota e guarda as chamadas. */
export function createFetch(routes) {
	const calls = [];
	const fetch = async (url, init = {}) => {
		calls.push({ url, init, body: init.body ? safeJson(init.body) : undefined });
		for (const [match, handler] of routes) {
			if (url.includes(match)) {
				const { status = 200, json = {} } = await handler(url, init);
				return { ok: status < 400, status, json: async () => json };
			}
		}
		return { ok: false, status: 404, json: async () => ({}) };
	};
	fetch.calls = calls;
	return fetch;
}

function safeJson(body) {
	try {
		return JSON.parse(body);
	} catch {
		return body;
	}
}
