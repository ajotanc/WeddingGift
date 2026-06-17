<script setup lang="ts">
import PageHeader from "@/components/reusable/PageHeader.vue";
import { useTenant } from "@/composables/useTenant";
import { formatMoney, parseMoney } from "@/lib/money";
import dayjs from "dayjs";
import { Gift, Package } from "lucide-vue-next";
import { computed, ref } from "vue";

const { tenant, purchases } = useTenant();
const loading = ref(false);

const totalAmount = computed(() => {
	return purchases.value
		.filter((p) => p.method === "pix")
		.reduce((acc, p) => acc + parseMoney(p.price_paid || "0"), 0);
});
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Presentes Recebidos" description="Acompanhe todos os presentes comprados pelos seus convidados.">
      <div class="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
        <p class="text-sm text-primary font-medium">Total em Presentes</p>
        <p class="text-xl font-bold text-primary">{{ formatMoney(totalAmount) }}</p>
      </div>
    </PageHeader>

    <div v-if="loading" class="text-center py-20 text-slate-400">
      Carregando...
    </div>
    
    <div v-else-if="purchases.length === 0" class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <Gift class="w-16 h-16 mx-auto text-slate-300 mb-4" />
      <h3 class="text-xl font-serif text-slate-900 mb-2">Nenhum presente recebido ainda</h3>
      <p class="text-slate-500 max-w-sm mx-auto">Quando seus convidados comprarem presentes ou pagarem cotas via PIX, eles aparecerão aqui.</p>
    </div>

    <div v-else class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              <th class="p-4 font-medium">Data</th>
              <th class="p-4 font-medium">Convidado</th>
              <th class="p-4 font-medium">Produto</th>
              <th class="p-4 font-medium text-center">Qtd</th>
              <th class="p-4 font-medium text-right">Valor Pago</th>
              <th class="p-4 font-medium text-center">Método</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="purchase in purchases" :key="purchase.$id" class="hover:bg-slate-50/50 transition-colors">
              <td class="p-4 text-sm text-slate-500 whitespace-nowrap">
                {{ dayjs(purchase.$createdAt).format('DD/MM/YYYY HH:mm') }}
              </td>
              <td class="p-4">
                <p class="text-sm font-medium text-slate-900 group relative inline-block cursor-help">
                  {{ (purchase.guest as any)?.name?.charAt(0) || '?' }}*** ****
                  <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-xs rounded px-2 py-1">
                    Ofuscado para surpresa!
                  </span>
                </p>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <Package class="w-4 h-4 text-slate-400" />
                  <p class="text-sm text-slate-700">{{ (purchase.product as any)?.name || 'Produto' }}</p>
                </div>
              </td>
              <td class="p-4 text-sm text-slate-700 text-center font-medium">
                {{ purchase.quantity }}
              </td>
              <td class="p-4 text-sm font-bold text-slate-900 text-right">
                <span v-if="purchase.method === 'pix'">{{ formatMoney(purchase.price_paid) }}</span>
                <span v-else class="text-slate-400 font-medium">-</span>
              </td>
              <td class="p-4 text-center">
                <span v-if="purchase.method === 'pix'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.12 11.48l-2.48-2.48a1 1 0 00-1.42 0L8.68 12.54a2 2 0 01-2.83 0 2 2 0 010-2.83l3.54-3.54a4 4 0 00-5.66-5.66L1.24 3.01a1 1 0 00-1.41 1.41l2.49 2.49a2 2 0 002.83 0 2 2 0 000-2.83L1.61.54A4 4 0 017.27.54l2.49 2.49a1 1 0 010 1.41L6.22 7.98a4 4 0 005.66 5.66l2.48 2.48a1 1 0 001.42 0l3.54-3.54a2 2 0 012.83 0 2 2 0 010 2.83l-3.54 3.54a4 4 0 005.66 5.66l2.49 2.49a1 1 0 001.41-1.41l-2.49-2.49a2 2 0 00-2.83 0 2 2 0 000 2.83l3.54 3.54a4 4 0 01-5.66-5.66l-2.49-2.49a1 1 0 010-1.41l3.54-3.54a4 4 0 00-5.66-5.66z"/>
                  </svg>
                  PIX
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Package class="w-3.5 h-3.5" />
                  Loja
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
