<script setup lang="ts">
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import {
	ArrowRight,
	CheckCircle,
	Coins,
	Gift,
	Heart,
	Sparkles,
} from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const goRegister = () => {
	router.push("/register");
};

const goLogin = () => {
	router.push("/login");
};

const goDashboard = () => {
	if (authStore.tenant?.slug) {
		router.push(`/${authStore.tenant.slug}/admin/dashboard`);
	} else {
		router.push("/login");
	}
};

const handleLogout = async () => {
	await authStore.logout();
};
</script>

<template>
  <main class="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased overflow-x-hidden selection:bg-rose-100 selection:text-rose-800">
    <!-- Ambient top glowing color gradient -->
    <div class="absolute top-0 right-0 left-0 h-[500px] bg-gradient-to-b from-rose-100/40 via-amber-50/20 to-transparent pointer-events-none -z-10"></div>

    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100/80">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Heart class="w-4 h-4 fill-white" />
          </div>
          <span class="text-xl font-bold tracking-tight text-slate-900 font-serif">Wedding Gift</span>
        </div>
        
        <div class="flex items-center gap-3">
          <template v-if="authStore.user">
            <GoogleAuthButton :user="authStore.user" @click="goDashboard" @logout="handleLogout" />
            <Button @click="goDashboard" class="rounded-full shadow-sm">
              Meu Painel <ArrowRight class="w-4 h-4 ml-1.5" />
            </Button>
          </template>
          <template v-else>
            <Button @click="goLogin" variant="ghost" class="text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 rounded-full">Entrar</Button>
            <Button @click="goRegister" class="bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-200 rounded-full font-medium">Criar Lista Grátis</Button>
          </template>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center space-y-8 relative">
      <div class="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100/60 px-4 py-1.5 rounded-full text-xs font-semibold text-rose-600 tracking-wide">
        <Sparkles class="w-3.5 h-3.5 fill-rose-100" /> Plataforma completa para seu casamento
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight font-serif max-w-4xl mx-auto leading-[1.1]">
        A lista de presentes perfeita, <br />
        <span class="bg-gradient-to-r from-rose-500 to-amber-600 bg-clip-text text-transparent">totalmente livre de taxas</span>.
      </h1>
      <p class="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light">
        Crie um site de casamento maravilhoso, receba presentes em dinheiro diretamente na sua conta via PIX e gerencie convidados e RSVPs com facilidade.
      </p>
      <div class="pt-4 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
        <Button size="lg" class="text-base px-8 h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg rounded-full flex-1" @click="goRegister">
          Começar Agora
        </Button>
        <Button size="lg" variant="outline" class="text-base px-8 h-12 border-slate-200 hover:bg-slate-100/40 rounded-full flex-1" @click="goRegister">
          Ver Exemplo
        </Button>
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-7xl mx-auto px-6 py-24 border-t border-slate-100/80">
      <div class="text-center mb-16 space-y-3">
        <h2 class="text-3xl md:text-4xl font-bold font-serif text-slate-900">Por que escolher o Wedding Gift?</h2>
        <p class="text-slate-500 max-w-xl mx-auto">Desenvolvemos cada detalhe para proporcionar a melhor experiência para você e seus convidados.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        <!-- Feature 1 -->
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.01)] transition-transform hover:-translate-y-1 duration-300">
          <div class="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Coins class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-slate-950 mb-3">0% Taxas nos Presentes</h3>
          <p class="text-slate-600 text-sm leading-relaxed">
            Diferente de outras plataformas, os valores dos presentes vão 100% direto para sua conta bancária via PIX, sem intermediários e sem taxas ocultas.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.01)] transition-transform hover:-translate-y-1 duration-300">
          <div class="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Gift class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-slate-950 mb-3">Visual Premium & Personalizável</h3>
          <p class="text-slate-600 text-sm leading-relaxed">
            Personalize as cores do site de acordo com a paleta do seu casamento. Adicione fotos do casal, cronograma de eventos, contagem regressiva e FAQs informativas.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.01)] transition-transform hover:-translate-y-1 duration-300">
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Sparkles class="w-6 h-6" />
          </div>
          <h3 class="text-xl font-bold text-slate-950 mb-3">IA para Agradecimentos</h3>
          <p class="text-slate-600 text-sm leading-relaxed">
            Economize tempo e envie respostas cheias de carinho. Nossa IA integrada gera mensagens personalizadas de agradecimento exclusivas para cada presente recebido.
          </p>
        </div>
      </div>
    </section>

    <!-- Detailed SaaS features highlights -->
    <section class="bg-white py-24 border-y border-slate-100/80">
      <div class="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-6">
          <h2 class="text-3xl md:text-4xl font-bold font-serif text-slate-900 leading-tight">
            Gestão integrada para controlar RSVPs e recados
          </h2>
          <p class="text-slate-600 leading-relaxed font-light">
            Tenha um painel administrativo com analytics avançados. Veja gráficos em tempo real da contagem de convidados, status de presença RSVP, volume total arrecadado e mensagens enviadas pelos convidados.
          </p>
          <ul class="space-y-3.5">
            <li class="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle class="w-5 h-5 text-rose-500 shrink-0" />
              RSVP digital completo com confirmação de acompanhantes.
            </li>
            <li class="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle class="w-5 h-5 text-rose-500 shrink-0" />
              Exportação da lista de convidados em formato Excel/CSV.
            </li>
            <li class="flex items-center gap-3 text-sm text-slate-700">
              <CheckCircle class="w-5 h-5 text-rose-500 shrink-0" />
              Gestão de cotas de lua de mel ou presentes físicos.
            </li>
          </ul>
        </div>
        <div class="bg-slate-50 border border-slate-100 p-8 rounded-3xl shadow-sm relative">
          <div class="absolute -top-4 -right-4 bg-rose-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md">
            Novidade ✨
          </div>
          <h3 class="font-serif text-slate-950 text-lg mb-4">Módulo de Planos & Assinatura</h3>
          <p class="text-sm text-slate-500 leading-relaxed mb-6">
            Libere recursos incríveis como paletas de cores customizadas, exportações de dados e controle estendido de convidados fazendo a ativação do plano Premium diretamente via Mercado Pago.
          </p>
          <div class="border-t border-slate-200/60 pt-4 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Integração Oficial</span>
            <span class="text-sm font-bold text-sky-600">Mercado Pago</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Plans Section -->
    <section class="max-w-6xl mx-auto px-6 py-24">
      <div class="text-center mb-16 space-y-3">
        <h2 class="text-3xl md:text-4xl font-bold font-serif text-slate-900">Escolha o plano ideal para seu casamento</h2>
        <p class="text-slate-500">Recursos poderosos para todos os momentos do casal.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <!-- Free Plan -->
        <div class="bg-white border border-slate-150 rounded-3xl p-8 relative flex flex-col justify-between shadow-sm">
          <div class="space-y-6">
            <div>
              <h3 class="text-xl font-bold text-slate-900">Plano Grátis</h3>
              <p class="text-slate-500 text-xs mt-1">Essencial para começar</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-slate-900 font-serif">R$ 0</span>
            </div>
            <ul class="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Lista de presentes PIX e cotas</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Agradecimentos gerados com IA</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Cores de tema pré-definidas</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Até 20 confirmações de presença (RSVP)</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> Galeria: máx 5 fotos Home / 50 públicas</li>
              <li class="flex items-start gap-2 text-slate-400 line-through"><CheckCircle class="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> Exportação de CSV de Convidados</li>
            </ul>
          </div>
          <Button variant="outline" class="w-full mt-8 rounded-full border-slate-200" @click="goRegister">Criar Conta Grátis</Button>
        </div>

        <!-- Trimestral Plan -->
        <div class="bg-white border border-slate-150 rounded-3xl p-8 relative flex flex-col justify-between shadow-sm">
          <div class="space-y-6">
            <div>
              <h3 class="text-xl font-bold text-slate-900">Plano Trimestral</h3>
              <p class="text-slate-500 text-xs mt-1">Perfeito para casamentos próximos</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-slate-900 font-serif">R$ 79,99</span>
              <span class="text-xs text-slate-500">/ 3 meses</span>
            </div>
            <ul class="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Site personalizado e cotas via PIX</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Convidados e confirmações ilimitados</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Galeria: máx 20 fotos Home / públicas ilimitadas</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Seletor de cores livre (Custom Theme)</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Contagem regressiva personalizada</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Exportação de convidados (Excel/CSV)</li>
            </ul>
          </div>
          <Button variant="outline" class="w-full mt-8 rounded-full border-slate-200" @click="goRegister">Escolher Trimestral</Button>
        </div>

        <!-- Semestral Plan -->
        <div class="bg-white border-2 border-rose-500 rounded-3xl p-8 relative flex flex-col justify-between shadow-lg shadow-rose-55">
          <div class="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Recomendado
          </div>
          <div class="space-y-6">
            <div>
              <h3 class="text-xl font-bold text-slate-900">Plano Semestral</h3>
              <p class="text-rose-500 text-xs font-semibold mt-1">Mais tempo para planejar e suporte</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-bold text-slate-900 font-serif">R$ 159,99</span>
              <span class="text-xs text-slate-500">/ 6 meses</span>
            </div>
            <ul class="space-y-3 text-sm text-slate-600 border-t border-slate-100 pt-6">
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Todos os recursos do Plano Trimestral</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Período estendido de 6 meses ativos</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Galeria: máx 20 fotos Home / públicas ilimitadas</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Customização completa de tema e logo</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Suporte prioritário via WhatsApp</li>
              <li class="flex items-start gap-2"><CheckCircle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /> Painel de Analytics completo</li>
            </ul>
          </div>
          <Button class="w-full mt-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md shadow-rose-200" @click="goRegister">Escolher Semestral</Button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white">
            <Heart class="w-3.5 h-3.5 fill-white" />
          </div>
          <span class="text-white font-bold font-serif">Wedding Gift</span>
        </div>
        <p class="text-sm">&copy; 2026 Wedding Gift. Feito com amor para o dia mais especial da sua vida.</p>
      </div>
    </footer>
  </main>
</template>
