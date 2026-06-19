<script setup lang="ts">
import PageHeader from "@/components/reusable/PageHeader.vue";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/composables/useTenant";
import { formatMoney } from "@/lib/money";
import {
	VisArea,
	VisAxis,
	VisCrosshair,
	VisDonut,
	VisLine,
	VisSingleContainer,
	VisTooltip,
	VisXYContainer,
} from "@unovis/vue";
import dayjs from "dayjs";
import {
	Calendar,
	Gift,
	Heart,
	MessageSquare,
	ShoppingBag,
	TrendingUp,
	Users,
	Wallet,
} from "lucide-vue-next";
import { computed } from "vue";

const { purchases, rsvps, messages, products } = useTenant();

// 1. Cotas (PIX)
const pixQuotaPurchases = computed(() =>
	purchases.value.filter(
		(p) => p.method === "pix" && p.product?.type === "quota",
	),
);
const totalRaisedPixQuota = computed(() =>
	pixQuotaPurchases.value.reduce(
		(acc, p) => acc + (Number(p.price_paid) || 0),
		0,
	),
);
const totalQuotaGoal = computed(() =>
	products.value
		.filter((p) => p.type === "quota")
		.reduce((acc, p) => acc + (Number(p.price) || 0), 0),
);

const quotaProgress = computed(() =>
	Math.min(
		(totalRaisedPixQuota.value / (totalQuotaGoal.value || 1)) * 100,
		100,
	),
);

// 3. Outros
const confirmedGuests = computed(() =>
	rsvps.value
		.filter((r) => r.status === "confirmed")
		.reduce(
			(acc, r) => acc + (r.total_adults || 0) + (r.total_children || 0),
			0,
		),
);

// 4. Evolução Financeira Arrecadada (Evolução Acumulada no Tempo)
const financialEvolutionData = computed(() => {
	const sorted = [...purchases.value]
		.filter((p) => p.method === "pix")
		.sort(
			(a, b) =>
				new Date(a.$createdAt).getTime() - new Date(b.$createdAt).getTime(),
		);

	if (sorted.length === 0) {
		return [{ date: dayjs().format("DD/MM"), value: 0 }];
	}

	const dailyTotals: Record<string, number> = {};
	for (const p of sorted) {
		const dateStr = dayjs(p.$createdAt).format("DD/MM");
		dailyTotals[dateStr] =
			(dailyTotals[dateStr] || 0) + (Number(p.price_paid) || 0);
	}

	let cumulativeSum = 0;
	return Object.entries(dailyTotals).map(([date, amount]) => {
		cumulativeSum += amount;
		return { date, value: cumulativeSum };
	});
});

const xAccessor = (d: { date: string; value: number }) =>
	financialEvolutionData.value.indexOf(d);
const yAccessor = (d: { date: string; value: number }) => d.value;
const xTickFormat = (index: number) =>
	financialEvolutionData.value[index]?.date || "";
const yTickFormat = (value: number) => `R$ ${value.toFixed(0)}`;

// 5. Estatísticas do RSVP
const rsvpStats = computed(() => {
	const confirmed = rsvps.value.filter((r) => r.status === "confirmed").length;
	const declined = rsvps.value.filter((r) => r.status === "declined").length;
	return [
		{ value: confirmed, color: "#10b981" },
		{ value: declined, color: "#f43f5e" },
	];
});

// Confirmed Headcount: Adults vs Children
const headcountStats = computed(() => {
	const adults = rsvps.value
		.filter((r) => r.status === "confirmed")
		.reduce((acc, r) => acc + (r.total_adults || 0), 0);
	const children = rsvps.value
		.filter((r) => r.status === "confirmed")
		.reduce((acc, r) => acc + (r.total_children || 0), 0);
	return [
		{ value: adults, color: "#3b82f6" },
		{ value: children, color: "#f59e0b" },
	];
});

// 7. Categorias de Presentes Mais Escolhidas
const categoryStats = computed(() => {
	const counts: Record<string, number> = {};
	for (const p of purchases.value) {
		const cat = p.product?.category || "Outros";
		counts[cat] = (counts[cat] || 0) + 1;
	}
	return Object.entries(counts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, 5);
});

const getDonutValue = (d: { value: number }) => d.value;
const getDonutColor = (d: { color: string }) => d.color;
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Visão Geral" description="Resumo analítico e financeiro do seu casamento." />

    <!-- Top Summary Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Card: Arrecadado via PIX (Cotas) -->
      <div class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-slate-400">Total Arrecadado</span>
            <div class="bg-emerald-100/60 p-2.5 rounded-2xl">
              <Wallet class="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p class="text-3xl font-serif font-bold text-slate-900 mb-4">{{ formatMoney(totalRaisedPixQuota) }}</p>
        </div>
        <div>
          <Progress :model-value="quotaProgress" class="h-1.5 mb-2 bg-slate-100" />
          <div class="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>{{ quotaProgress.toFixed(0) }}% da meta de cotas</span>
            <span>Meta: {{ formatMoney(totalQuotaGoal) }}</span>
          </div>
        </div>
      </div>

      <!-- Card: Presentes Confirmados -->
      <div class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-slate-400">Presentes Recebidos</span>
          <div class="bg-violet-100/60 p-2.5 rounded-2xl">
            <Gift class="w-5 h-5 text-violet-600" />
          </div>
        </div>
        <p class="text-3xl font-serif font-bold text-slate-900">{{ purchases.length }}</p>
        <p class="text-xs text-slate-400 mt-2 font-medium">Total acumulado de cotas e presentes físicos.</p>
      </div>

      <!-- Card: Convidados Confirmados -->
      <div class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-slate-400">Presenças Confirmadas</span>
          <div class="bg-sky-100/60 p-2.5 rounded-2xl">
            <Users class="w-5 h-5 text-sky-600" />
          </div>
        </div>
        <p class="text-3xl font-serif font-bold text-slate-900">{{ confirmedGuests }} pessoas</p>
        <p class="text-xs text-slate-400 mt-2 font-medium">Adultos e crianças confirmados no RSVP.</p>
      </div>

      <!-- Card: Mural de Recados -->
      <div class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-slate-400">Recados Recebidos</span>
          <div class="bg-orange-100/60 p-2.5 rounded-2xl">
            <MessageSquare class="w-5 h-5 text-orange-600" />
          </div>
        </div>
        <p class="text-3xl font-serif font-bold text-slate-900">{{ messages.length }} mensagens</p>
        <p class="text-xs text-slate-400 mt-2 font-medium">Carinho enviado pelos seus convidados.</p>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Financial Evolution Chart & Top Categories -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Financial Evolution Card -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <div class="space-y-1">
              <h3 class="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp class="w-5 h-5 text-emerald-500" /> Evolução de Arrecadação
              </h3>
              <p class="text-xs text-slate-400">Histórico de presentes acumulado dia após dia</p>
            </div>
          </div>

          <div class="h-64 w-full">
            <VisXYContainer :data="financialEvolutionData" class="w-full h-full">
              <VisArea :x="xAccessor" :y="yAccessor" color="#10b981" :opacity="0.1" />
              <VisLine :x="xAccessor" :y="yAccessor" color="#10b981" :strokeWidth="2.5" />
              <VisAxis type="x" :tickFormat="xTickFormat" :gridLine="false" />
              <VisAxis type="y" :tickFormat="yTickFormat" :gridLine="true" />
              <VisCrosshair />
              <VisTooltip />
            </VisXYContainer>
          </div>
        </div>

        <!-- Top Categories Card -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <div class="space-y-1 mb-6">
            <h3 class="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag class="w-5 h-5 text-violet-500" /> Categorias Populares
            </h3>
            <p class="text-xs text-slate-400">Divisão dos presentes escolhidos pelos convidados</p>
          </div>

          <div v-if="categoryStats.length === 0" class="text-center py-8 text-slate-400 text-sm">
            Nenhum presente comprado ainda.
          </div>
          <div v-else class="space-y-4">
            <div v-for="(cat, i) in categoryStats" :key="cat.name" class="space-y-2">
              <div class="flex justify-between items-center text-sm font-medium">
                <span class="text-slate-700">{{ cat.name }}</span>
                <span class="text-slate-400">{{ cat.count }} {{ cat.count === 1 ? 'presente' : 'presentes' }}</span>
              </div>
              <div class="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                  :style="{
                    width: `${(cat.count / purchases.length) * 100}%`,
                    backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'][i % 5]
                  }">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: RSVP Charts -->
      <div class="space-y-8">
        <!-- RSVP Status Donut -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center">
          <div class="w-full text-left space-y-1 mb-6">
            <h3 class="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-sky-500" /> Adesão do RSVP
            </h3>
            <p class="text-xs text-slate-400">Proporção de convidados confirmados</p>
          </div>

          <div v-if="rsvps.length === 0" class="text-center py-12 text-slate-400 text-sm">
            Nenhuma resposta de RSVP recebida.
          </div>
          <div v-else class="flex flex-col items-center w-full">
            <div class="h-48 w-48 relative flex items-center justify-center">
              <VisSingleContainer :data="rsvpStats" class="w-full h-full">
                <VisDonut :value="getDonutValue" :color="getDonutColor" :innerRadius="65" />
              </VisSingleContainer>
              <div class="absolute flex flex-col items-center text-center">
                <span class="text-3xl font-bold text-slate-800">{{ rsvpStats[0].value }}</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Confirmados</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-50">
              <div class="flex items-center gap-2.5">
                <div class="w-3.5 h-3.5 rounded-full bg-emerald-500"></div>
                <div class="flex flex-col">
                  <span class="text-xs text-slate-400 font-medium">Confirmados</span>
                  <span class="text-sm font-bold text-slate-800">{{ rsvpStats[0].value }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="w-3.5 h-3.5 rounded-full bg-rose-500"></div>
                <div class="flex flex-col">
                  <span class="text-xs text-slate-400 font-medium">Não irão</span>
                  <span class="text-sm font-bold text-slate-800">{{ rsvpStats[1].value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirmed Headcount: Adults vs Children -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center">
          <div class="w-full text-left space-y-1 mb-6">
            <h3 class="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
              <Heart class="w-5 h-5 text-rose-500" /> Perfil das Presenças
            </h3>
            <p class="text-xs text-slate-400">Distribuição entre adults e crianças</p>
          </div>

          <div v-if="confirmedGuests === 0" class="text-center py-12 text-slate-400 text-sm">
            Nenhum convidado confirmado ainda.
          </div>
          <div v-else class="flex flex-col items-center w-full">
            <div class="h-48 w-48 relative flex items-center justify-center">
              <VisSingleContainer :data="headcountStats" class="w-full h-full">
                <VisDonut :value="getDonutValue" :color="getDonutColor" :innerRadius="65" />
              </VisSingleContainer>
              <div class="absolute flex flex-col items-center text-center">
                <span class="text-3xl font-bold text-slate-800">{{ confirmedGuests }}</span>
                <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total</span>
              </div>
            </div>

            <!-- Legend -->
            <div class="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-50">
              <div class="flex items-center gap-2.5">
                <div class="w-3.5 h-3.5 rounded-full bg-blue-500"></div>
                <div class="flex flex-col">
                  <span class="text-xs text-slate-400 font-medium">Adultos</span>
                  <span class="text-sm font-bold text-slate-800">{{ headcountStats[0].value }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="w-3.5 h-3.5 rounded-full bg-amber-500"></div>
                <div class="flex flex-col">
                  <span class="text-xs text-slate-400 font-medium">Crianças</span>
                  <span class="text-sm font-bold text-slate-800">{{ headcountStats[1].value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
