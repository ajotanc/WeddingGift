<script setup lang="ts">
import PageHeader from "@/components/reusable/PageHeader.vue";
import { useTenant } from "@/composables/useTenant";
import { formatMoney, parseMoney } from "@/lib/money";
import dayjs from "dayjs";
import { Gift, Package } from "lucide-vue-next";
import { computed, ref } from "vue";

const { purchases } = useTenant();
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

    <div v-else-if="purchases.length === 0"
      class="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
      <Gift class="w-16 h-16 mx-auto text-slate-300 mb-4" />
      <h3 class="text-xl font-serif text-slate-900 mb-2">Nenhum presente recebido ainda</h3>
      <p class="text-slate-500 max-w-sm mx-auto">Quando seus convidados comprarem presentes ou pagarem cotas via PIX,
        eles aparecerão aqui.</p>
    </div>

    <div v-else class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              <th class="p-4 font-medium">Data</th>
              <th class="p-4 font-medium">Convidado</th>
              <th class="p-4 font-medium">Produto</th>
              <th class="p-4 font-medium">Tipo</th>
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
                  {{ purchase.guest?.name?.charAt(0) || '?' }}*** ****
                  <span
                    class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-xs rounded px-2 py-1">
                    Ofuscado para surpresa!
                  </span>
                </p>
              </td>
              <td class="p-4">
                <div class="flex items-center gap-2">
                  <Package class="w-4 h-4 text-slate-400" />
                  <p class="text-sm text-slate-700">{{ purchase.product.name || 'Produto' }}</p>
                </div>
              </td>
              <td class="p-4 text-sm text-slate-700 text-center font-medium">
                {{ purchase.product.type === 'quota' ? 'Cota' : 'Físico' }}
              </td>
              <td class="p-4 text-sm text-slate-700 text-center font-medium">
                {{ purchase.quantity }}
              </td>
              <td class="p-4 text-sm font-bold text-slate-900 text-right">
                <span v-if="purchase.method === 'pix'">{{ formatMoney(purchase.price_paid) }}</span>
                <span v-else class="text-slate-400 font-medium">-</span>
              </td>
              <td class="p-4 text-center">
                <span v-if="purchase.method === 'pix'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  <svg fill="currentColor" width="14px" height="14px" viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" />
                    <path
                      d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" />
                  </svg>
                  PIX
                </span>
                <span v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
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
