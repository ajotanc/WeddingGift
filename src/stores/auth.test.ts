import { AppwriteException } from "appwrite";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	account: {
		get: vi.fn(),
		getSession: vi.fn(),
		updatePrefs: vi.fn(),
		deleteSession: vi.fn(),
		createOAuth2Session: vi.fn(),
	},
	tenant: {
		create: vi.fn(),
		get: vi.fn(),
		getByCoOwner: vi.fn(),
		update: vi.fn(),
		isTeamMember: vi.fn(),
	},
	actions: { syncAccess: vi.fn() },
	guest: { upsert: vi.fn() },
	consent: { log: vi.fn() },
}));

vi.mock("@/lib/appwrite", () => ({ account: mocks.account }));
vi.mock("@/services/tenant.service", () => ({ TenantService: mocks.tenant }));
vi.mock("@/services/guest.service", () => ({ GuestService: mocks.guest }));
vi.mock("@/services/actions.service", () => ({
	ActionsService: mocks.actions,
}));
vi.mock("@/services/consent.service", () => ({
	ConsentService: mocks.consent,
}));

import { DEFAULT_PRIMARY_COLOR } from "@/lib/defaults";
import type { ITenant } from "@/services/tenant.service";
import { useAuthStore } from "./auth";

const user = {
	$id: "user-1",
	name: "Noivo",
	email: "noivo@email.com",
	prefs: { fetched_avatar: true },
};

const tenant = {
	$id: "user-1",
	slug: "joao-e-maria",
	plan: "free",
	primary_color: "#C5A880",
} as unknown as ITenant;

const unauthorized = () =>
	new AppwriteException("User (role: guests) missing scope", 401);

beforeEach(() => {
	setActivePinia(createPinia());
	localStorage.clear();
	vi.clearAllMocks();
	mocks.account.getSession.mockResolvedValue({ provider: "email" });
	mocks.tenant.isTeamMember.mockResolvedValue(true);
	mocks.actions.syncAccess.mockResolvedValue({ success: true });
	mocks.guest.upsert.mockImplementation(async (id: string, data: object) => ({
		$id: id,
		...data,
	}));
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("fetchSessionUser", () => {
	it("retorna null sem tentar de novo quando não há sessão (401)", async () => {
		mocks.account.get.mockRejectedValue(unauthorized());
		const store = useAuthStore();

		await expect(store.fetchSessionUser()).resolves.toBeNull();
		expect(mocks.account.get).toHaveBeenCalledTimes(1);
	});

	it("tenta de novo em erros temporários", async () => {
		vi.useFakeTimers();
		mocks.account.get
			.mockRejectedValueOnce(new TypeError("Failed to fetch"))
			.mockResolvedValueOnce(user);
		const store = useAuthStore();

		const promise = store.fetchSessionUser();
		await vi.runAllTimersAsync();

		await expect(promise).resolves.toEqual(user);
		expect(mocks.account.get).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
	});

	it("desiste depois do número máximo de tentativas", async () => {
		vi.useFakeTimers();
		mocks.account.get.mockRejectedValue(new AppwriteException("down", 503));
		const store = useAuthStore();

		const promise = store.fetchSessionUser(3);
		const assertion = expect(promise).rejects.toThrow("down");
		await vi.runAllTimersAsync();

		await assertion;
		expect(mocks.account.get).toHaveBeenCalledTimes(3);
		vi.useRealTimers();
	});
});

describe("init", () => {
	it("carrega usuário, casal e convidado", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockResolvedValue(tenant);
		const store = useAuthStore();

		await store.init();

		expect(store.user?.$id).toBe("user-1");
		expect(store.tenant?.slug).toBe("joao-e-maria");
		expect(store.guest?.$id).toBe("user-1");
		expect(store.isAdmin).toBe(true);
		expect(store.loading).toBe(false);
	});

	it("deixa deslogado quando não há sessão", async () => {
		mocks.account.get.mockRejectedValue(unauthorized());
		const store = useAuthStore();

		await store.init();

		expect(store.user).toBeNull();
		expect(store.tenant).toBeNull();
		expect(store.loading).toBe(false);
	});

	it("cria o casal pendente do cadastro e limpa o localStorage", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.create.mockResolvedValue(tenant);
		localStorage.setItem("pending_tenant", JSON.stringify({ slug: "x" }));
		const store = useAuthStore();

		await store.init();

		expect(mocks.tenant.create).toHaveBeenCalledWith({ slug: "x" }, "user-1");
		expect(store.tenant?.slug).toBe("joao-e-maria");
		expect(localStorage.getItem("pending_tenant")).toBeNull();
	});

	it("não desloga quando um cadastro pendente antigo falha", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.create.mockRejectedValue(
			new AppwriteException("Row already exists", 409),
		);
		mocks.tenant.get.mockResolvedValue(tenant);
		localStorage.setItem("pending_tenant", JSON.stringify({ slug: "x" }));
		localStorage.setItem("pending_consent", "{}");
		const store = useAuthStore();

		await store.init();

		expect(store.user?.$id).toBe("user-1");
		expect(store.tenant?.slug).toBe("joao-e-maria");
		expect(localStorage.getItem("pending_tenant")).toBeNull();
		expect(localStorage.getItem("pending_consent")).toBeNull();
	});

	it("não desloga quando o pendente está corrompido", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockResolvedValue(tenant);
		localStorage.setItem("pending_tenant", "{json quebrado");
		const store = useAuthStore();

		await store.init();

		expect(store.user?.$id).toBe("user-1");
		expect(mocks.tenant.create).not.toHaveBeenCalled();
	});

	it("procura o casal como co-proprietário quando não é dono", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockRejectedValue(new AppwriteException("not found", 404));
		mocks.tenant.getByCoOwner.mockResolvedValue({ ...tenant, $id: "outro" });
		const store = useAuthStore();

		await store.init();

		expect(mocks.tenant.getByCoOwner).toHaveBeenCalledWith("noivo@email.com");
		expect(store.tenant?.$id).toBe("outro");
		expect(store.isAdmin).toBe(false);
	});
});

describe("acesso ao time do casal", () => {
	it("não chama o servidor quando já é membro", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockResolvedValue(tenant);
		const store = useAuthStore();

		await store.init();

		expect(mocks.actions.syncAccess).not.toHaveBeenCalled();
	});

	it("sincroniza quando ainda não está no time (ex.: co-administrador)", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockRejectedValue(new AppwriteException("not found", 404));
		mocks.tenant.getByCoOwner.mockResolvedValue({ ...tenant, $id: "outro" });
		mocks.tenant.isTeamMember.mockResolvedValue(false);
		const store = useAuthStore();

		await store.init();

		expect(mocks.actions.syncAccess).toHaveBeenCalledWith("outro");
	});

	it("sempre sincroniza logo após criar o casal", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.create.mockResolvedValue(tenant);
		localStorage.setItem("pending_tenant", JSON.stringify({ slug: "x" }));
		const store = useAuthStore();

		await store.init();

		expect(mocks.actions.syncAccess).toHaveBeenCalledWith("user-1");
		expect(mocks.tenant.isTeamMember).not.toHaveBeenCalled();
	});

	it("falha na sincronização não desloga", async () => {
		mocks.account.get.mockResolvedValue(user);
		mocks.tenant.get.mockResolvedValue(tenant);
		mocks.tenant.isTeamMember.mockResolvedValue(false);
		mocks.actions.syncAccess.mockRejectedValue(new Error("offline"));
		const store = useAuthStore();

		await store.init();

		expect(store.user?.$id).toBe("user-1");
		expect(store.tenant?.slug).toBe("joao-e-maria");
	});

	it("não existe mais upgrade de plano pelo navegador", () => {
		const store = useAuthStore() as unknown as Record<string, unknown>;
		expect(store.upgradeTenant).toBeUndefined();
	});
});

describe("sanitizeTenant", () => {
	it("remove recursos premium de casais no plano gratuito", () => {
		const store = useAuthStore();
		const result = store.sanitizeTenant({
			...tenant,
			primary_color: "#123456",
			show_countdown: true,
			show_quiz: true,
			music_url: "https://musica",
		} as ITenant);

		expect(result?.is_premium).toBe(false);
		expect(result?.primary_color).toBe(DEFAULT_PRIMARY_COLOR);
		expect(result?.show_countdown).toBe(false);
		expect(result?.show_quiz).toBe(false);
		expect(result?.music_url).toBeNull();
	});

	it("mantém recursos de premium válido e expira premium vencido", () => {
		const store = useAuthStore();
		const future = new Date(Date.now() + 86_400_000).toISOString();
		const past = new Date(Date.now() - 86_400_000).toISOString();
		const premium = {
			...tenant,
			plan: "premium",
			primary_color: "#123456",
			show_quiz: true,
		} as ITenant;

		const active = store.sanitizeTenant({ ...premium, premium_until: future });
		expect(active?.is_premium).toBe(true);
		expect(active?.primary_color).toBe("#123456");

		const expired = store.sanitizeTenant({ ...premium, premium_until: past });
		expect(expired?.is_premium).toBe(false);
		expect(expired?.show_quiz).toBe(false);
	});

	it("retorna null para casal inexistente", () => {
		const store = useAuthStore();
		expect(store.sanitizeTenant(null)).toBeNull();
	});
});

describe("logout", () => {
	it("limpa o estado mesmo se a API falhar", async () => {
		mocks.account.deleteSession.mockRejectedValue(new Error("offline"));
		const store = useAuthStore();
		store.user = user as never;
		store.tenant = tenant;

		await store.logout();

		expect(store.user).toBeNull();
		expect(store.tenant).toBeNull();
	});
});
