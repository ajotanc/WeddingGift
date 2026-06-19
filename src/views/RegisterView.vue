<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { ref } from "vue";
import { toast } from "vue-sonner";
const authStore = useAuthStore();
const loading = ref(false);

const form = ref({
	groom_name: "",
	bride_name: "",
	slug: "",
	pix_key: "",
	primary_color: "#ec4899",
});

const generateSlug = () => {
	if (form.value.groom_name && form.value.bride_name && !form.value.slug) {
		form.value.slug = `${form.value.groom_name}-${form.value.bride_name}`
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)+/g, "");
	}
};

const registerTenant = async () => {
	loading.value = true;
	try {
		const coupleName = `${form.value.bride_name} & ${form.value.groom_name}`;

		localStorage.setItem(
			"pending_tenant",
			JSON.stringify({
				slug: form.value.slug,
				couple_name: coupleName,
				groom_name: form.value.groom_name,
				bride_name: form.value.bride_name,
				pix_key: form.value.pix_key,
				plan: "free",
				show_countdown: true,
				guest_limit: null,
				primary_color: form.value.primary_color,
				background_color: "#ffffff",
				background_image: null,
			}),
		);

		// Redirect to OAuth
		await authStore.loginWithGoogle(
			`${window.location.origin}/`,
			`${window.location.origin}/register?error=1`,
		);
	} catch (error) {
		console.error("Registration error", error);
		toast.error("Erro", {
			description: "Erro ao iniciar registro.",
		});
		loading.value = false;
	}
};
</script>

<template>
  <main class="min-h-screen bg-slate-50 py-20 px-4">
    <div class="max-w-md mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900">Crie sua Lista de Casamento</h1>
        <p class="text-slate-500 mt-2">Tudo em um só lugar. Rápido, lindo e seguro.</p>
      </div>

      <Card class="p-8">
        <form @submit.prevent="registerTenant" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label class="block mb-1">Nome do Noivo</Label>
              <Input v-model="form.groom_name" required placeholder="Ex: João" @blur="generateSlug" />
            </div>
            <div>
              <Label class="block mb-1">Nome da Noiva</Label>
              <Input v-model="form.bride_name" required placeholder="Ex: Maria" @blur="generateSlug" />
            </div>
          </div>

          <div>
            <Label class="block mb-1">Link Personalizado</Label>
            <div class="flex items-center">
              <span
                class="bg-slate-100 border border-r-0 border-slate-300 rounded-l-md px-3 h-10 flex items-center text-slate-500 text-sm">wedding.app/</span>
              <Input v-model="form.slug" required placeholder="joao-e-maria" class="rounded-l-none" />
            </div>
          </div>

          <div>
            <Label class="block mb-1">Sua Chave PIX</Label>
            <Input v-model="form.pix_key" required placeholder="Para receber as cotas direto na conta" />
            <p class="text-xs text-slate-500 mt-1">Nós não cobramos taxas sobre os presentes em dinheiro.</p>
          </div>

          <div>
            <Label class="block mb-1">Cor do Casamento</Label>
            <div class="flex items-center gap-4">
              <input type="color" v-model="form.primary_color" class="w-10 h-10 p-1 rounded cursor-pointer" />
              <span class="text-sm font-mono text-slate-600">{{ form.primary_color }}</span>
            </div>
          </div>

          <Button type="submit" class="w-full" size="lg" :disabled="loading">
            {{ loading ? 'Criando Conta...' : 'Continuar com Google' }}
          </Button>
        </form>
      </Card>
    </div>
  </main>
</template>
