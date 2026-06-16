<script setup lang="ts">
import { useConfirm } from "@/components/ui/confirm-dialog/useConfirm";
import { useToast } from "@/components/ui/toast/use-toast";
import { useTenant } from "@/composables/useTenant";
import { generateThankYouMessage } from "@/lib/ai";
import type { IGuest } from "@/services/guest.service";
import { MessageService } from "@/services/message.service";
import { formatPhone } from "@brazilian-utils/brazilian-utils";
import dayjs from "dayjs";
import { computed, ref } from "vue";
import * as XLSX from "xlsx";

const { toast } = useToast();
const { confirm } = useConfirm();
const { tenant, rsvps, messages } = useTenant();

const rsvpStats = computed(() => {
	const confirmed = rsvps.value.filter((r) => r.status === "confirmed");
	const declined = rsvps.value.filter((r) => r.status === "declined");

	return {
		adults: confirmed.reduce((acc, r) => acc + (r.total_adults || 0), 0),
		children: confirmed.reduce((acc, r) => acc + (r.total_children || 0), 0),
		declinedCount: declined.length,
	};
});

const populatedMessages = computed(() => {
	return messages.value.map((msg) => ({
		...msg,
		guest: msg.guest as IGuest,
	}));
});

const deleteMsg = async (id: string) => {
	const isConfirmed = await confirm({
		title: "Excluir Recado",
		description:
			"Tem certeza de que deseja excluir este recado? Esta ação não pode ser desfeita.",
		confirmText: "Sim",
		cancelText: "Não",
	});

	if (isConfirmed) {
		await MessageService.delete(id);
		messages.value = messages.value.filter((m) => m.$id !== id);

		toast({
			variant: "success",
			title: "Sucesso",
			description: "Mensagem excluída!",
		});
	}
};

// Gemini AI
const aiThanks = ref("");
const showThanksModal = ref(false);
const generatingThanks = ref(false);

const guestPhone = ref<string | undefined>(undefined);

const generateThanks = async (guest: IGuest) => {
	showThanksModal.value = true;
	generatingThanks.value = true;
	aiThanks.value = "";

	guestPhone.value = guest.phone;

	try {
		aiThanks.value = await generateThankYouMessage(
			guest.name,
			tenant.value?.couple_name || "nós",
		);
	} catch (err) {
		console.error("Erro ao gerar agradecimento:", err);
		aiThanks.value =
			"Houve um erro ao gerar a mensagem. Tente novamente mais tarde.";
	} finally {
		generatingThanks.value = false;
	}
};

const copyThanks = () => {
	navigator.clipboard.writeText(aiThanks.value);
	toast({
		variant: "success",
		title: "Sucesso",
		description: "Texto copiado!",
	});

	guestPhone.value = undefined;
};

const openWhatsApp = () => {
	const url = `https://api.whatsapp.com/send/?phone=${guestPhone.value}&text=${encodeURIComponent(aiThanks.value)}`;
	window.open(url, "_blank");

	guestPhone.value = undefined;
};

const copyRSVPList = () => {
	const text = rsvps.value
		.map(
			(r) =>
				`${r.guest.name} (${r.status === "confirmed" ? "Confirmado" : "Não irá"}) - Adultos: ${r.total_adults}, Crianças: ${r.total_children}`,
		)
		.join("\n");
	navigator.clipboard.writeText(text);
	toast({
		variant: "success",
		title: "Sucesso",
		description: "Lista copiada para a área de transferência!",
	});
};

const exportToExcel = () => {
	const confirmed = rsvps.value.filter((r) => r.status === "confirmed");

	if (confirmed.length === 0) {
		toast({
			title: "Exportação Vazia",
			description: "Nenhum convidado confirmado para exportar.",
			variant: "destructive",
		});
		return;
	}

	const dataToExport = confirmed.map((r) => ({
		Nome: r.guest.name,
		Telefone: formatPhone(r.guest.phone || "", { mask: "auto" }),
		Email: r.guest.email || "Não informado",
		Adultos: r.total_adults || 0,
		Crianças: r.total_children || 0,
	}));

	const worksheet = XLSX.utils.json_to_sheet(dataToExport);
	const workbook = XLSX.utils.book_new();
	const timestamp = dayjs().unix();
	XLSX.utils.book_append_sheet(workbook, worksheet, "Confirmados");

	XLSX.writeFile(workbook, `CONVIDADOS_CONFIRMADOS_${timestamp}.xlsx`);

	toast({
		variant: "success",
		title: "Sucesso",
		description: "Planilha exportada com sucesso!",
	});
};
</script>

<template>
  <div class="space-y-12">
    <!-- Header -->
    <AdminHeader title="Convidados & Recados" description="Acompanhe as confirmações de presença e o mural." />

    <!-- Metrics -->
    <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div class="flex items-center gap-4 mb-6">
        <div class="bg-primary/10 p-3 rounded-2xl">
          <Users class="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 class="font-medium text-slate-900 text-lg">Confirmações de Presença (RSVP)</h3>
          <p class="text-sm text-slate-500 font-light">Contagem baseada nas respostas dos convidados.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Adultos Confirmados</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.adults }}</span>
        </div>
        <div
          class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Crianças Confirmadas</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.children }}</span>
        </div>
        <div
          class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-center items-center text-center">
          <span class="text-slate-500 text-sm mb-2">Não Poderão Ir</span>
          <span class="text-4xl font-serif text-slate-900">{{ rsvpStats.declinedCount }}</span>
        </div>

      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- RSVP List -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 class="font-medium text-slate-900">Lista de Respostas</h3>
          <button @click="exportToExcel" class="text-primary hover:bg-primary/5 transition-colors p-2 rounded-full" title="Exportar Planilha">
            <Download class="w-4 h-4" />
          </button>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="r in rsvps" :key="r.$id" class="p-6 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p class="font-medium text-slate-900">{{ r.guest.name }}</p>
              <p class="text-sm text-slate-500 mt-1">{{ formatPhone(r.guest.phone!, { mask: 'auto' }) }} • {{
                r.guest?.email || 'Sem email' }}</p>
              <div class="mt-3 flex gap-2">
                <span v-if="r.status === 'confirmed'"
                  class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-md font-medium">Confirmado</span>
                <span v-else class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-md font-medium">Ausente</span>
                <span v-if="r.status === 'confirmed'"
                  class="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{{ r.total_adults }} Adultos, {{
                    r.total_children }} Crianças</span>
              </div>
            </div>
            <div v-if="r.status === 'confirmed'" class="flex flex-col justify-center">
              <button @click="generateThanks(r.guest)"
                class="text-primary text-sm font-medium hover:underline flex items-center gap-1 bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                <Sparkles :size="14" /> IA
              </button>
            </div>
          </div>
          <div v-if="rsvps.length === 0" class="p-10 text-center text-slate-400">Nenhum RSVP recebido ainda.</div>
        </div>
      </div>

      <!-- Messages Wall -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-medium text-slate-900">Mural de Recados</h3>
        </div>
        <div class="divide-y divide-slate-100">
          <div v-for="m in populatedMessages" :key="m.$id" class="p-6">
            <div class="flex justify-between items-start gap-4">
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-900 mb-2">{{ m.guest?.name }}</p>
                <p class="text-slate-600 italic font-serif leading-relaxed">"{{ m.content }}"</p>
              </div>
              <button @click="deleteMsg(m.$id)"
                class="text-red-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div v-if="messages.length === 0" class="p-10 text-center text-slate-400">Nenhuma mensagem recebida ainda.
          </div>
        </div>
      </div>
    </div>

    <!-- IA Thanks Modal -->
    <Dialog v-model:open="showThanksModal" title="Agradecimento IA">
      <div class="space-y-4 text-center">
        <div v-if="generatingThanks" class="text-slate-500 py-6 animate-pulse font-light">A IA do Gemini está
          escrevendo...</div>
        <div v-else>
          <p class="bg-slate-50 p-6 rounded-2xl text-slate-800 text-left italic mb-6 border border-slate-100">"{{
            aiThanks }}"</p>
          <div class="flex gap-3">
            <Button @click="copyThanks" variant="outline" class="flex-1 shadow-sm">
              <Copy class="w-4 h-4 mr-2" /> Copiar
            </Button>
            <Button class="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm border-0" @click="openWhatsApp">
              <MessageCircle class="w-4 h-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>
