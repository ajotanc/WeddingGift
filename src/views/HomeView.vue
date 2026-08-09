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
	Star,
	Users,
	MessageSquare,
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
  <main class="min-h-screen bg-[#FAF8F6] text-[#2C2421] font-sans antialiased overflow-x-hidden selection:bg-[#C5A880]/20 selection:text-[#8C6D45]">
    <!-- Ambient top glowing color gradient -->
    <div class="absolute top-0 right-0 left-0 h-[600px] bg-gradient-to-b from-[#C5A880]/15 via-[#FAF8F6]/5 to-transparent pointer-events-none -z-10"></div>

    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-[#FAF8F6]/80 backdrop-blur-md border-b border-[#E8E2DD]/60">
      <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[#C5A880] flex items-center justify-center text-white shadow-sm shadow-[#C5A880]/30">
            <Heart class="w-4 h-4 fill-white" />
          </div>
          <span class="text-2xl font-semibold tracking-wide text-[#1E1A17] font-serif">Wedding Gift</span>
        </div>
        
        <div class="flex items-center gap-4">
          <template v-if="authStore.user">
            <GoogleAuthButton :user="authStore.user" @click="goDashboard" @logout="handleLogout" />
            <Button @click="goDashboard" class="rounded-full bg-[#1E1A17] hover:bg-[#2C2421] text-white shadow-sm px-6">
              Meu Painel <ArrowRight class="w-4 h-4 ml-1.5" />
            </Button>
          </template>
          <template v-else>
            <Button @click="goLogin" variant="ghost" class="text-[#5A4F4A] hover:text-[#1E1A17] hover:bg-[#FAF8F6]/40 rounded-full font-medium">Entrar</Button>
            <Button @click="goRegister" disabled class="bg-[#1E1A17] hover:bg-[#2C2421] text-white shadow-sm rounded-full font-medium px-6">Criar Lista Grátis</Button>
          </template>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-20 relative">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <!-- Left Side: Editorial Content -->
        <div class="lg:col-span-7 space-y-8 text-left">
          <div class="inline-flex items-center gap-2 bg-[#FAF8F6] border border-[#C5A880]/30 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#8C6D45] uppercase tracking-widest bg-white/50">
            <Sparkles class="w-3.5 h-3.5 text-[#C5A880]" /> A Plataforma Definitiva de Casamentos
          </div>
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1E1A17] tracking-tight font-serif leading-[1.12]">
            A lista de presentes perfeita, <br />
            <span class="italic text-[#C5A880] font-normal">totalmente livre de taxas.</span>
          </h1>
          <p class="text-base sm:text-lg text-[#5A4F4A] max-w-xl leading-relaxed font-light">
            Crie um site de casamento de alta costura. Receba presentes em dinheiro diretamente na sua conta via PIX e gerencie convidados e RSVPs de forma sofisticada e sem burocracias.
          </p>
          <div class="pt-4 flex flex-col sm:flex-row gap-4 max-w-md">
            <Button size="lg" class="text-sm px-8 h-13 bg-[#1E1A17] hover:bg-[#2C2421] text-white shadow-md rounded-full flex-1 font-semibold uppercase tracking-wider transition-all" @click="goRegister" disabled>
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" class="text-sm px-8 h-13 border-[#C5A880]/60 hover:bg-[#FAF8F6] text-[#2C2421] rounded-full flex-1 font-semibold uppercase tracking-wider transition-all" @click="$router.push('/emilly-alerson')">
              Ver Exemplo
            </Button>
          </div>
        </div>

        <!-- Right Side: Interactive Mockup Showcase -->
        <div class="lg:col-span-5 relative mt-8 lg:mt-0">
          <!-- Background decorative shapes -->
          <div class="absolute -top-12 -left-12 w-64 h-64 bg-[#C5A880]/10 rounded-full blur-3xl -z-10"></div>
          <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-[#C5A880]/15 rounded-full blur-2xl -z-10"></div>
          
          <div class="relative">
            <!-- Main Mockup Card -->
            <div class="relative bg-white border border-[#E8E2DD] p-6 rounded-[2.5rem] shadow-xl max-w-sm mx-auto overflow-hidden z-20">
              <!-- Mock Header -->
              <div class="text-center pb-5 border-b border-[#FAF8F6]">
                <div class="w-12 h-12 rounded-full bg-[#C5A880]/10 flex items-center justify-center mx-auto mb-3 text-[#C5A880]">
                  <Heart class="w-5 h-5 fill-current" />
                </div>
                <h3 class="font-serif text-xl text-[#1E1A17] font-semibold">Ana & Lucas</h3>
                <p class="text-[9px] text-[#8C6D45] uppercase tracking-widest font-semibold mt-1">05 de Setembro de 2026</p>
              </div>
              
              <!-- Mock Timer -->
              <div class="grid grid-cols-3 gap-2 my-5 text-center">
                <div class="bg-[#FAF8F6] p-2.5 rounded-2xl border border-[#E8E2DD]">
                  <span class="block font-serif text-lg text-[#1E1A17] font-bold">124</span>
                  <span class="text-[8px] text-slate-400 uppercase font-bold">Dias</span>
                </div>
                <div class="bg-[#FAF8F6] p-2.5 rounded-2xl border border-[#E8E2DD]">
                  <span class="block font-serif text-lg text-[#1E1A17] font-bold">12</span>
                  <span class="text-[8px] text-slate-400 uppercase font-bold">Horas</span>
                </div>
                <div class="bg-[#FAF8F6] p-2.5 rounded-2xl border border-[#E8E2DD]">
                  <span class="block font-serif text-lg text-[#1E1A17] font-bold">45</span>
                  <span class="text-[8px] text-slate-400 uppercase font-bold">Min</span>
                </div>
              </div>
              
              <!-- Mock Items -->
              <div class="space-y-3">
                <div class="bg-[#FAF8F6] p-3 rounded-2xl border border-[#E8E2DD] flex items-center gap-3">
                  <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#E8E2DD]">
                    <Gift class="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div class="flex-1 text-left">
                    <h4 class="text-xs font-serif font-bold text-[#1E1A17]">Cotas para Maldivas</h4>
                    <div class="w-full bg-[#E8E2DD] h-1.5 rounded-full mt-2 overflow-hidden">
                      <div class="bg-[#C5A880] h-full" style="width: 75%"></div>
                    </div>
                  </div>
                  <span class="text-[9px] font-bold text-[#8C6D45] bg-[#C5A880]/15 px-2 py-0.5 rounded-full">75%</span>
                </div>
                
                <div class="bg-[#FAF8F6] p-3 rounded-2xl border border-[#E8E2DD] flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-[#E8E2DD]">
                      <Heart class="w-5 h-5 text-[#C5A880] fill-current" />
                    </div>
                    <div class="text-left">
                      <h4 class="text-xs font-serif font-bold text-[#1E1A17]">Taças de Cristal</h4>
                      <span class="text-[9px] text-[#C5A880] font-semibold">Garantido com Amor</span>
                    </div>
                  </div>
                  <Heart class="w-4 h-4 text-rose-500 fill-current" />
                </div>
              </div>
            </div>

            <!-- Overlapping Offset Badge 1 -->
            <div class="absolute -right-8 top-16 bg-[#FAF8F6] border border-[#E8E2DD] p-4 rounded-2xl shadow-lg z-30 flex items-center gap-3 animate-bounce-slow max-w-[160px]">
              <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users class="w-4 h-4" />
              </div>
              <div class="text-left">
                <span class="block text-[10px] text-slate-400 uppercase font-bold">Confirmados</span>
                <span class="text-base font-serif font-bold text-[#1E1A17]">87 Convidados</span>
              </div>
            </div>

            <!-- Overlapping Offset Badge 2 -->
            <div class="absolute -left-8 bottom-8 bg-[#FAF8F6] border border-[#E8E2DD] p-4 rounded-2xl shadow-lg z-30 flex items-center gap-3 animate-float max-w-[170px]">
              <div class="w-8 h-8 rounded-full bg-amber-50 text-[#C5A880] flex items-center justify-center">
                <MessageSquare class="w-4 h-4" />
              </div>
              <div class="text-left">
                <span class="block text-[10px] text-slate-400 uppercase font-bold">Mural de Recados</span>
                <span class="text-xs font-serif font-medium text-[#1E1A17]">"Felicidades ao lindo casal..."</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="max-w-7xl mx-auto px-6 py-28 border-t border-[#E8E2DD]">
      <div class="text-left mb-20 max-w-2xl space-y-4">
        <span class="text-xs uppercase tracking-widest font-bold text-[#C5A880]">Uma experiência única</span>
        <h2 class="text-4xl md:text-5xl font-serif text-[#1E1A17] font-semibold leading-tight">Por que escolher o <br />Wedding Gift?</h2>
        <p class="text-[#5A4F4A] font-light text-base md:text-lg">Desenvolvemos cada detalhe para proporcionar o máximo de elegância para você e seus convidados.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <!-- Feature 1 -->
        <div class="border-l border-[#C5A880]/30 pl-6 space-y-4 transition-all duration-300 hover:border-[#C5A880]">
          <span class="font-serif text-3xl italic text-[#C5A880]">I.</span>
          <h3 class="text-xl font-serif font-bold text-[#1E1A17]">Taxa Zero Absoluta</h3>
          <p class="text-[#5A4F4A] text-sm leading-relaxed font-light">
            Diferente de outras plataformas, os valores dos presentes vão 100% direto para sua conta bancária via PIX, sem taxas de administração intermediárias.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="border-l border-[#C5A880]/30 pl-6 space-y-4 transition-all duration-300 hover:border-[#C5A880]">
          <span class="font-serif text-3xl italic text-[#C5A880]">II.</span>
          <h3 class="text-xl font-serif font-bold text-[#1E1A17]">Estética Editorial</h3>
          <p class="text-[#5A4F4A] text-sm leading-relaxed font-light">
            A paleta do casamento é respeitada. Fotos, cronogramas, contagens regressivas e locais com previsão de clima em layouts dignos de um convite impresso de luxo.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="border-l border-[#C5A880]/30 pl-6 space-y-4 transition-all duration-300 hover:border-[#C5A880]">
          <span class="font-serif text-3xl italic text-[#C5A880]">III.</span>
          <h3 class="text-xl font-serif font-bold text-[#1E1A17]">Agradecimentos com Carinho</h3>
          <p class="text-[#5A4F4A] text-sm leading-relaxed font-light">
            Nossa inteligência integrada gera rascunhos de mensagens calorosas de agradecimento, personalizadas de acordo com o presente enviado.
          </p>
        </div>
      </div>
    </section>

    <!-- Detailed Features Highlight -->
    <section class="bg-white py-28 border-y border-[#E8E2DD]">
      <div class="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div class="lg:col-span-7 space-y-6">
          <span class="text-xs uppercase tracking-widest font-bold text-[#C5A880]">Gestão Premium</span>
          <h2 class="text-4xl font-serif text-[#1E1A17] font-semibold leading-tight">
            Controle e delicadeza em <br />um único painel
          </h2>
          <p class="text-[#5A4F4A] leading-relaxed font-light text-base">
            Gerencie RSVPs, mensagens e recebimentos com gráficos limpos e precisão de dados. Tudo foi desenhado para evitar a frieza de painéis tradicionais e manter o clima romântico e acolhedor.
          </p>
          <ul class="space-y-4 pt-2">
            <li class="flex items-center gap-3 text-sm text-[#5A4F4A]">
              <div class="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></div>
              Confirmação de presença detalhada para acompanhantes e restrições.
            </li>
            <li class="flex items-center gap-3 text-sm text-[#5A4F4A]">
              <div class="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></div>
              Exportação limpa e estruturada de convidados para assessores.
            </li>
            <li class="flex items-center gap-3 text-sm text-[#5A4F4A]">
              <div class="w-1.5 h-1.5 rounded-full bg-[#C5A880]"></div>
              Gestão de cotas de lua de mel e presentes customizados.
            </li>
          </ul>
        </div>
        <div class="lg:col-span-5">
          <div class="border border-[#E8E2DD] p-8 rounded-[2rem] bg-[#FAF8F6] relative overflow-hidden">
            <div class="absolute top-0 right-0 bg-[#C5A880] text-white text-[9px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-widest shadow-sm">
              Premium ✨
            </div>
            <h3 class="font-serif text-[#1E1A17] text-2xl font-semibold mb-4 mt-2">Módulo de Planos & Assinatura</h3>
            <p class="text-sm text-[#5A4F4A] leading-relaxed mb-6 font-light">
              Desbloqueie recursos de alta costura visual, paletas de cores livres, exportação avançada e suporte prioritário ativando o plano diretamente via Mercado Pago.
            </p>
            <div class="border-t border-[#E8E2DD]/70 pt-4 flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-[#8C6D45]">Parceria Oficial</span>
              <span class="text-xs font-bold text-slate-800 tracking-wide">Mercado Pago</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Plans Section (Coleções) -->
    <section class="max-w-6xl mx-auto px-6 py-28">
      <div class="text-center mb-20 space-y-4">
        <span class="text-xs uppercase tracking-widest font-bold text-[#C5A880]">Nossas Assinaturas</span>
        <h2 class="text-4xl font-serif text-[#1E1A17] font-semibold">Selecione a Coleção do seu Casamento</h2>
        <p class="text-[#5A4F4A] font-light max-w-md mx-auto">Recursos sob medida para dar vida ao seu dia perfeito.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Collection Essencial -->
        <div class="bg-white border border-[#E8E2DD] rounded-[2rem] p-8 flex flex-col justify-between transition-all hover:shadow-md duration-300">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-serif font-bold text-[#1E1A17]">Coleção Essencial</h3>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Essencial para começar</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-semibold text-[#1E1A17] font-serif">R$ 0</span>
            </div>
            <ul class="space-y-3.5 text-xs text-[#5A4F4A] border-t border-[#FAF8F6] pt-6 leading-relaxed">
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Lista de presentes PIX e cotas</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Agradecimentos gerados com IA</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Paleta de cores clássica pré-definida</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Até 20 confirmações de presença (RSVP)</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Galeria: máx 5 fotos Home / 50 públicas</li>
              <li class="flex items-start gap-2.5 text-slate-300 line-through"><Star class="w-3.5 h-3.5 text-slate-200 mt-0.5 shrink-0" /> Exportação de CSV de Convidados</li>
            </ul>
          </div>
          <Button variant="outline" class="w-full mt-8 rounded-full border-[#C5A880]/60 text-[#1E1A17] hover:bg-[#FAF8F6] font-semibold text-xs uppercase tracking-wider py-2.5" @click="goRegister">Criar Conta Grátis</Button>
        </div>

        <!-- Collection Elegance -->
        <div class="bg-white border border-[#E8E2DD] rounded-[2rem] p-8 flex flex-col justify-between transition-all hover:shadow-md duration-300">
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-serif font-bold text-[#1E1A17]">Coleção Elegance</h3>
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Perfeito para casamentos próximos</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-semibold text-[#1E1A17] font-serif">R$ 79,99</span>
              <span class="text-[10px] text-slate-400 font-medium">/ 3 meses</span>
            </div>
            <ul class="space-y-3.5 text-xs text-[#5A4F4A] border-t border-[#FAF8F6] pt-6 leading-relaxed">
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Site personalizado e cotas via PIX</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Convidados e confirmações ilimitados</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Galeria: máx 20 fotos Home / públicas ilimitadas</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Seletor de cores livre (Custom Theme)</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Contagem regressiva personalizada</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0" /> Exportação de convidados (Excel/CSV)</li>
            </ul>
          </div>
          <Button variant="outline" class="w-full mt-8 rounded-full border-[#C5A880]/60 text-[#1E1A17] hover:bg-[#FAF8F6] font-semibold text-xs uppercase tracking-wider py-2.5" @click="goRegister">Escolher Elegance</Button>
        </div>

        <!-- Collection Couture -->
        <div class="bg-white border-2 border-[#C5A880] rounded-[2rem] p-8 relative flex flex-col justify-between shadow-xl shadow-[#C5A880]/5">
          <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C5A880] text-white text-[9px] font-bold px-5 py-1 rounded-full uppercase tracking-widest">
            Mais Recomendado
          </div>
          <div class="space-y-6">
            <div>
              <h3 class="text-lg font-serif font-bold text-[#1E1A17]">Coleção Couture</h3>
              <p class="text-[#C5A880] text-[10px] font-bold uppercase tracking-widest mt-1">Planejamento e suporte completo</p>
            </div>
            <div class="flex items-baseline gap-1">
              <span class="text-4xl font-semibold text-[#1E1A17] font-serif">R$ 159,99</span>
              <span class="text-[10px] text-slate-400 font-medium">/ 6 meses</span>
            </div>
            <ul class="space-y-3.5 text-xs text-[#5A4F4A] border-t border-[#FAF8F6] pt-6 leading-relaxed">
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Todos os recursos da Coleção Elegance</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Período estendido de 6 meses ativos</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Galeria: máx 20 fotos Home / públicas ilimitadas</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Customização completa de tema e logo</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Suporte prioritário via WhatsApp</li>
              <li class="flex items-start gap-2.5"><Star class="w-3.5 h-3.5 text-[#C5A880] mt-0.5 shrink-0 fill-current" /> Painel de Analytics de recebimentos completo</li>
            </ul>
          </div>
          <Button class="w-full mt-8 bg-[#1E1A17] hover:bg-[#2C2421] text-white rounded-full shadow-md font-semibold text-xs uppercase tracking-wider py-2.5" @click="goRegister">Escolher Couture</Button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[#1E1A17] text-[#8C8480] py-16 border-t border-[#2C2421]">
      <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-[#C5A880] flex items-center justify-center text-white">
            <Heart class="w-4 h-4 fill-white" />
          </div>
          <span class="text-white font-bold font-serif tracking-wide text-lg">Wedding Gift</span>
        </div>
        <p class="text-xs font-light">&copy; 2026 Wedding Gift. Feito com cuidado editorial e amor para o dia mais especial da sua vida.</p>
      </div>
    </footer>
  </main>
</template>

<style scoped>
@keyframes bounceSlow {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(6px) rotate(-1deg);
  }
}

.animate-bounce-slow {
  animation: bounceSlow 4s ease-in-out infinite;
}

.animate-float {
  animation: float 5s ease-in-out infinite;
}
</style>
