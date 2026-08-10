<script setup lang="ts">
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth";
import { onMounted } from "vue";
import { useRoute } from "vue-router";
import { toast } from "vue-sonner";

const authStore = useAuthStore();
const route = useRoute();

onMounted(async () => {
	// Verifica se o usuário logou mas não possui um casamento registrado
	if (route.query.no_tenant === "1" || (authStore.user && !authStore.tenant)) {
		toast.error("Acesso Negado", {
			description:
				"Sua conta Google não possui um casamento cadastrado. Crie uma conta na página de cadastro.",
		});
		await authStore.logout();
	}
});

const handleGoogleLogin = async () => {
	await authStore.loginWithGoogle(window.location.href, window.location.href);
};
</script>

<template>
  <main class="min-h-screen bg-champagne py-20 px-4 font-sans text-slate-800 flex items-center justify-center relative overflow-hidden">
    <!-- Ambient top glowing color gradient -->
    <div class="absolute top-0 right-0 left-0 h-[600px] bg-gradient-to-b from-primary/15 via-champagne/5 to-transparent pointer-events-none -z-10"></div>

    <div class="max-w-md w-full relative z-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-semibold text-slate-900 font-serif tracking-tight">Login - Painel do Casal</h1>
        <p class="text-slate-600 mt-2 text-sm font-light">Acesse a plataforma para gerenciar seus presentes e convidados.</p>
      </div>

      <Card class="p-8 border border-slate-200 shadow-xl shadow-primary/5 rounded-[2.5rem] bg-white">
        <div class="space-y-6">
          <div>
            <p class="text-sm font-medium text-slate-900 mb-4 text-center">Entrar com sua conta</p>
            <GoogleAuthButton @click="handleGoogleLogin" :disabled="authStore.loading" :fill="true" class="w-full flex items-center justify-center text-sm font-semibold cursor-pointer transition-all" />
          </div>
          
          <div class="mt-6 text-center border-t border-slate-200 pt-6">
            <p class="text-sm text-slate-600">
              Ainda não tem uma conta?
              <router-link to="/register" class="font-medium text-primary hover:underline transition-colors">
                Cadastre-se aqui
              </router-link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  </main>
</template>
