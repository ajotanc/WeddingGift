import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createExecution: vi.fn() }));

vi.mock("@/lib/appwrite", () => ({
	functions: { createExecution: mocks.createExecution },
}));

import { ActionsService } from "./actions.service";
import { PaymentService } from "./payment.service";

beforeEach(() => {
	vi.clearAllMocks();
	sessionStorage.clear();
});

describe("OAuth do Mercado Pago", () => {
	it("gera link com state aleatório, não com o id do casal", () => {
		const url = new URL(PaymentService.getAuthUrl("tenant-1"));
		const state = url.searchParams.get("state");

		expect(state).toBeTruthy();
		expect(state).not.toBe("tenant-1");
		expect(url.searchParams.get("redirect_uri")).toBe(
			`${window.location.origin}/admin/config/mercadopago`,
		);
	});

	it("aceita o retorno só uma vez e só com o state desta aba", () => {
		const state = new URL(
			PaymentService.getAuthUrl("tenant-1"),
		).searchParams.get("state") as string;

		expect(PaymentService.consumeOAuthState(state, "tenant-1")).toBe(true);
		expect(PaymentService.consumeOAuthState(state, "tenant-1")).toBe(false);
	});

	it("rejeita link forjado (state antigo, de outro casal ou ausente)", () => {
		const state = new URL(
			PaymentService.getAuthUrl("tenant-1"),
		).searchParams.get("state") as string;

		expect(PaymentService.consumeOAuthState(state, "tenant-2")).toBe(false);
		PaymentService.getAuthUrl("tenant-1");
		expect(PaymentService.consumeOAuthState("tenant-1", "tenant-1")).toBe(
			false,
		);
		expect(PaymentService.consumeOAuthState("", "tenant-1")).toBe(false);
	});

	it("desconecta pela Function, não pelo navegador", async () => {
		mocks.createExecution.mockResolvedValue({
			responseStatusCode: 200,
			responseBody: "{}",
		});

		await PaymentService.disconnect("tenant-1");

		const call = mocks.createExecution.mock.calls[0][0];
		expect(call.functionId).toBe("mp-oauth");
		expect(JSON.parse(call.body)).toEqual({
			action: "disconnect",
			tenantId: "tenant-1",
		});
	});
});

describe("ActionsService", () => {
	it("envia a ação para app-actions e devolve a resposta", async () => {
		mocks.createExecution.mockResolvedValue({
			status: "completed",
			responseStatusCode: 200,
			responseBody: JSON.stringify({ success: true, likes: ["g1"] }),
		});

		const res = await ActionsService.toggleLike("messages", "m1");

		expect(res.likes).toEqual(["g1"]);
		const call = mocks.createExecution.mock.calls[0][0];
		expect(call.functionId).toBe("app-actions");
		expect(JSON.parse(call.body)).toEqual({
			action: "toggle_like",
			table: "messages",
			rowId: "m1",
		});
	});

	it("transforma erro do servidor em exceção com a mensagem dele", async () => {
		mocks.createExecution.mockResolvedValue({
			status: "completed",
			responseStatusCode: 403,
			responseBody: JSON.stringify({ error: "Acesso negado." }),
		});

		await expect(
			ActionsService.deleteContent("messages", "m1"),
		).rejects.toThrow("Acesso negado.");
	});

	it("trata execução que falhou sem corpo", async () => {
		mocks.createExecution.mockResolvedValue({
			status: "failed",
			responseStatusCode: 0,
			responseBody: "",
		});

		await expect(ActionsService.syncAccess("t1")).rejects.toThrow(
			"Não foi possível concluir a ação.",
		);
	});
});
