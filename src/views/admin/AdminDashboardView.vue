<script setup lang="ts">
import PageHeader from "@/components/reusable/PageHeader.vue";
import { Progress } from "@/components/ui/progress";
import { useTenant } from "@/composables/useTenant";
import {
	Wallet,
	Target,
	ShoppingBag,
	Gift,
	Users,
	MessageSquare,
} from "lucide-vue-next";
import { computed } from "vue";
import { formatMoney } from "@/lib/money";

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

// 2. Físicos (PIX)
const pixPhysicalPurchases = computed(() =>
	purchases.value.filter(
		(p) => p.method === "pix" && p.product?.type === "physical",
	),
);
const totalRaisedPixPhysical = computed(() =>
	pixPhysicalPurchases.value.reduce(
		(acc, p) => acc + (Number(p.price_paid) || 0),
		0,
	),
);

// 3. Loja (Links)
const linkPurchases = computed(() =>
	purchases.value.filter((p) => p.method === "link"),
);

const totalLinkItems = computed(() =>
	linkPurchases.value.reduce((acc, p) => acc + (p.quantity || 1), 0),
);

// 4. Outros
const confirmedGuests = computed(() =>
	rsvps.value
		.filter((r) => r.status === "confirmed")
		.reduce(
			(acc, r) => acc + (r.total_adults || 0) + (r.total_children || 0),
			0,
		),
);
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Visão Geral" description="Resumo do seu casamento até agora." />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Card: Arrecadado via PIX (Cotas) -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="bg-emerald-100 p-3 rounded-2xl">
            <Wallet class="w-6 h-6 text-emerald-600" />
          </div>
          <h3 class="font-medium text-slate-500">Arrecadado via PIX (Cotas)</h3>
        </div>
        <p class="text-3xl font-serif text-slate-900 mb-4">{{ formatMoney(totalRaisedPixQuota) }}</p>
        <Progress :model-value="quotaProgress" class="h-2 mb-2" />
        <div class="flex justify-between text-xs text-slate-400">
          <span>{{ quotaProgress.toFixed(0) }}%</span>
          <span>Meta: {{ formatMoney(totalQuotaGoal) }}</span>
        </div>
      </div>

      <!-- Card: Presentes Físicos (PIX) -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="bg-violet-100 p-3 rounded-2xl">
            <Gift class="w-6 h-6 text-violet-600" />
          </div>
          <h3 class="font-medium text-slate-500">Presentes Físicos (PIX)</h3>
        </div>
        <p class="text-3xl font-serif text-slate-900">{{ formatMoney(totalRaisedPixPhysical) }}</p>
        <p class="text-sm text-slate-400 mt-2">Valor total de produtos físicos comprados via PIX.</p>
      </div>

      <!-- Card: Produtos comprados em Loja -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div class="flex items-center gap-4 mb-4">
          <div class="bg-blue-100 p-3 rounded-2xl">
            <ShoppingBag class="w-6 h-6 text-blue-600" />
          </div>
          <h3 class="font-medium text-slate-500">Produtos comprados em Loja</h3>
        </div>
        <p class="text-3xl font-serif text-slate-900">{{ totalLinkItems }} itens</p>
        <p class="text-sm text-slate-400 mt-2">Total de presentes retirados da lista via links externos.</p>
      </div>

      <!-- Card: Convidados e Recados (Pode dividir se preferir, aqui mantive compacto) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card Convidados -->
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <!-- Adicionamos o container aqui -->
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-sky-100 p-3 rounded-2xl">
              <Users class="w-6 h-6 text-sky-600" />
            </div>
            <h3 class="font-medium text-slate-500">Convidados</h3>
          </div>
          <p class="text-3xl font-serif text-slate-900">{{ confirmedGuests }}</p>
        </div>

        <!-- Card Recados -->
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
          <!-- Adicionamos o container aqui -->
          <div class="flex items-center gap-4 mb-4">
            <div class="bg-orange-100 p-3 rounded-2xl">
              <MessageSquare class="w-6 h-6 text-orange-600" />
            </div>
            <h3 class="font-medium text-slate-500">Recados</h3>
          </div>
          <p class="text-3xl font-serif text-slate-900">{{ messages.length }}</p>
        </div>
      </div>

    </div>
  </div>
</template>
