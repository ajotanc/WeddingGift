<script setup lang="ts">
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
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 font-serif">
          Login - Painel do Casal
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600">
          Acesse a plataforma para gerenciar seus presentes e convidados.
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
          <div class="space-y-6">
            <div>
              <p class="text-sm font-medium text-slate-700 mb-4 text-center">Entrar com sua conta</p>
              <GoogleAuthButton @click="handleGoogleLogin" :disabled="authStore.loading" class="w-full" />
            </div>
            
            <div class="mt-6 text-center">
              <p class="text-sm text-slate-500">
                Ainda não tem uma conta?
                <router-link to="/register" class="font-medium text-primary hover:text-primary/80 transition-colors">
                  Cadastre-se aqui
                </router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
