<script setup lang="ts">
import { useTenant } from "@/composables/useTenant";
import { computed } from "vue";

const { tenant, products, purchases, rsvps, messages } = useTenant();

const totalRaised = computed(() => {
	return purchases.value.reduce((acc, p) => acc + (p.price_paid || 0), 0);
});

const confirmedGuests = computed(() => {
	return rsvps.value
		.filter((r) => r.status === "confirmed")
		.reduce(
			(acc, r) => acc + (r.total_adults || 0) + (r.total_children || 0),
			0,
		);
});
</script>

<template>
  <div class="space-y-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-serif text-slate-900 tracking-tight">Visão Geral</h2>
        <p class="text-sm text-slate-500">Resumo do seu casamento até agora.</p>
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Wallet Card -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-green-100 p-3 rounded-2xl">
            <Wallet class="w-6 h-6 text-green-600" />
          </div>
          <h3 class="font-medium text-slate-900 text-lg">Arrecadado</h3>
        </div>
        <div class="mt-auto">
          <p class="text-sm text-slate-500 mb-1">Total em cotas e produtos convertidos</p>
          <span class="text-4xl font-serif text-slate-900">R$ {{ totalRaised.toLocaleString('pt-BR',
            { minimumFractionDigits: 2 }) }}</span>
        </div>
      </div>

      <!-- Guests Card -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-blue-100 p-3 rounded-2xl">
            <Users class="w-6 h-6 text-blue-600" />
          </div>
          <h3 class="font-medium text-slate-900 text-lg">Convidados</h3>
        </div>
        <div class="mt-auto">
          <p class="text-sm text-slate-500 mb-1">Presenças confirmadas</p>
          <span class="text-4xl font-serif text-slate-900">{{ confirmedGuests }}</span>
        </div>
      </div>

      <!-- Messages Card -->
      <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col">
        <div class="flex items-center gap-4 mb-6">
          <div class="bg-orange-100 p-3 rounded-2xl">
            <MessageSquare class="w-6 h-6 text-orange-600" />
          </div>
          <h3 class="font-medium text-slate-900 text-lg">Recados</h3>
        </div>
        <div class="mt-auto">
          <p class="text-sm text-slate-500 mb-1">Mensagens no mural</p>
          <span class="text-4xl font-serif text-slate-900">{{ messages.length }}</span>
        </div>
      </div>

    </div>
  </div>
</template>
