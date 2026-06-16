import type { IMessage, IMessageDraft } from "@/schemas/message";
import { MessageService } from "@/services/message";
import { defineStore } from "pinia";

export const useMessageStore = defineStore("message", {
	state: () => ({
		messages: [] as IMessage[],
		loading: false,
		error: null as string | null,
	}),

	actions: {
		async fetchMessages(tenantId: string) {
			this.loading = true;
			this.error = null;
			try {
				this.messages = await MessageService.listByTenant(tenantId);
			} catch (err) {
				if (err instanceof Error) this.error = err.message;
				else this.error = "Erro ao carregar mensagens";
			} finally {
				this.loading = false;
			}
		},

		async submitMessage(payload: IMessageDraft) {
			try {
				const newMessage = await MessageService.create(payload);
				this.messages.unshift(newMessage);
				return newMessage;
			} catch (err) {
				console.error("Erro ao submeter mensagem", err);
				throw err;
			}
		},

		async deleteMessage(id: string) {
			try {
				await MessageService.delete(id);
				this.messages = this.messages.filter((m) => m.id !== id);
			} catch (err) {
				console.error("Erro ao deletar mensagem", err);
				throw err;
			}
		},
	},
});
