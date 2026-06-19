<script setup lang="ts">
import { Card } from "@/components/ui/card";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
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
  <main class="min-h-screen bg-slate-50 py-20 px-4 font-sans text-slate-600 flex items-center justify-center">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900 font-serif">Login - Painel do Casal</h1>
        <p class="text-slate-500 mt-2 text-sm">Acesse a plataforma para gerenciar seus presentes e convidados.</p>
      </div>

      <Card class="p-8 border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl bg-white">
        <div class="space-y-6">
          <div>
            <p class="text-sm font-medium text-slate-700 mb-4 text-center">Entrar com sua conta</p>
            <GoogleAuthButton @click="handleGoogleLogin" :disabled="authStore.loading" class="w-full flex items-center justify-center py-2.5 h-11 text-sm font-semibold rounded-xl cursor-pointer" />
          </div>
          
          <div class="mt-6 text-center border-t border-slate-100 pt-6">
            <p class="text-sm text-slate-500">
              Ainda não tem uma conta?
              <router-link to="/register" class="font-medium text-primary hover:text-primary/80 transition-colors">
                Cadastre-se aqui
              </router-link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  </main>
</template>
