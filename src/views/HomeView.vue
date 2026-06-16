<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const goRegister = () => {
	router.push("/register");
};

const goLogin = () => {
	router.push("/login");
};
</script>

<template>
  <main class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="flex items-center justify-between px-6 py-4 border-b border-slate-100 max-w-7xl mx-auto">
      <div class="text-2xl font-bold tracking-tight text-primary">WeddingGift SaaS</div>
      <div>
        <Button @click="goLogin" variant="ghost" class="mr-2">Entrar</Button>
        <Button @click="goRegister">Criar Lista Grátis</Button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="py-24 px-6 text-center max-w-4xl mx-auto space-y-8">
      <h1 class="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
        A lista de presentes perfeita para o seu <span class="text-primary">casamento</span>.
      </h1>
      <p class="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Crie seu site personalizado, receba presentes em dinheiro (PIX direto na sua conta sem taxas) e gerencie o RSVP dos convidados. Tudo em uma única plataforma elegante.
      </p>
      <div class="pt-4 flex flex-col sm:flex-row justify-center gap-4">
        <Button size="lg" class="text-lg px-8 h-14" @click="goRegister">Começar Agora</Button>
        <Button size="lg" variant="outline" class="text-lg px-8 h-14">Ver Demonstração</Button>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-slate-50 py-24 px-6 border-t border-slate-100">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div>
          <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">0%</div>
          <h3 class="text-xl font-bold mb-3">Sem Taxas Ocultas</h3>
          <p class="text-slate-600">Receba presentes em dinheiro diretamente via PIX, o valor cai 100% na sua conta.</p>
        </div>
        <div>
          <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">✨</div>
          <h3 class="text-xl font-bold mb-3">Design Elegante</h3>
          <p class="text-slate-600">Personalize seu site com as cores do seu casamento. Uma experiência premium para seus convidados.</p>
        </div>
        <div>
          <div class="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">🤖</div>
          <h3 class="text-xl font-bold mb-3">Agradecimentos IA</h3>
          <p class="text-slate-600">Gere mensagens de agradecimento personalizadas instantaneamente com o poder da Inteligência Artificial.</p>
        </div>
      </div>
    </section>

  </main>
</template>
