<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const handleGoogleLogin = async () => {
	// Use current URL to redirect back, but since we are at /login, it might redirect back to /login
	// The router guard will catch the logged in user and redirect to their dashboard
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
