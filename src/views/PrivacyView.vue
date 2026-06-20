<script setup lang="ts">
import { ArrowLeft, ShieldCheck } from "lucide-vue-next";
import { computed } from "vue";

const currentYear = computed(() => new Date().getFullYear());
</script>

<template>
	<div class="min-h-screen bg-slate-50 text-slate-600 font-sans antialiased selection:bg-primary selection:text-white">
		<!-- Header -->
		<header class="bg-white border-b border-slate-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
			<div class="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
				<router-link to="/" class="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors text-sm font-medium">
					<ArrowLeft class="w-4 h-4" />
					<span>Voltar ao início</span>
				</router-link>
				<span class="text-xs text-slate-400 font-light">Última atualização: Junho de {{ currentYear }}</span>
			</div>
		</header>

		<!-- Content -->
		<main class="max-w-3xl mx-auto px-6 py-12 md:py-20 space-y-12">
			<!-- Title Section -->
			<div class="space-y-4 text-center md:text-left">
				<div class="inline-flex w-12 h-12 bg-primary/10 text-primary rounded-2xl items-center justify-center">
					<ShieldCheck class="w-6 h-6" />
				</div>
				<h1 class="text-3xl md:text-4xl font-serif text-slate-900 leading-tight">Política de Privacidade</h1>
				<p class="text-slate-500 font-light text-base md:text-lg max-w-2xl leading-relaxed">
					Entenda como coletamos, utilizamos, armazenamos e protegemos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).
				</p>
			</div>

			<!-- Document Body -->
			<article class="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 text-slate-600 leading-relaxed font-light">
				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">1. Informações Gerais e LGPD</h2>
					<p>
						No <strong>Wedding Gift</strong>, a privacidade e a segurança das suas informações são nossas prioridades. Esta Política de Privacidade descreve as práticas adotadas no tratamento de dados pessoais dos noivos e de seus respectivos convidados, em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">2. Dados Pessoais Coletados</h2>
					<p>
						Apenas coletamos as informações estritamente necessárias para a prestação adequada de nossos serviços:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>
							<strong>Dados dos Noivos:</strong> Nomes, endereço de e-mail, telefone/WhatsApp, chave PIX, informações do evento (data, hora, local) e fotos/imagens fornecidas no layout do convite.
						</li>
						<li>
							<strong>Dados dos Convidados:</strong> Nome completo, endereço de e-mail e telefone/WhatsApp (coletados na identificação por login), informações de confirmação de presença (RSVP, número de adultos/crianças, nomes de acompanhantes, restrições alimentares) e mensagens enviadas no mural de recados.
						</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">3. Finalidade do Tratamento de Dados</h2>
					<p>
						O tratamento de dados pessoais é fundamentado nos termos do artigo 7º, inciso I (consentimento) e inciso V (execução de contrato/serviço) da LGPD, para as seguintes finalidades:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Permitir o funcionamento adequado do convite online e controle de presença (RSVP).</li>
						<li>Gerenciar a lista de presentes e notificar os noivos sobre presentes recebidos.</li>
						<li>Garantir a identificação de segurança dos convidados para que possam interagir com o site de forma autêntica e segura, evitando spam ou falsificação de identidade.</li>
						<li>Permitir que os noivos entrem em contato direto com os convidados confirmados por WhatsApp para alinhar detalhes da recepção.</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">4. Compartilhamento e Compartimentalização de Dados</h2>
					<p>
						Os dados dos convidados (nomes, RSVP, mensagens enviadas e restrições alimentares) são compartilhados **exclusivamente** com o casal organizador do respectivo casamento por meio do painel administrativo protegido de cada conta. O Wedding Gift **não vende, não aluga e não compartilha** dados pessoais de usuários com quaisquer outras empresas ou terceiros para fins publicitários ou comerciais.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">5. Armazenamento e Segurança dos Dados</h2>
					<p>
						Os dados são processados e armazenados em servidores seguros, utilizando a plataforma de computação em nuvem <strong>Appwrite</strong>. Empregamos criptografia de ponta no tráfego de dados e controle rigoroso de acessos administrativos. Mantemos um registro imutável e seguro de logs de consentimento dos convidados ao enviarem suas informações.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">6. Direitos dos Titulares de Dados</h2>
					<p>
						Nos termos do artigo 18 da LGPD, você possui os seguintes direitos garantidos:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Confirmação da existência e acesso às suas informações tratadas na plataforma.</li>
						<li>Correção de dados incompletos, inexatos ou desatualizados.</li>
						<li>Anonimização ou eliminação de seus dados pessoais.</li>
						<li>Revogação do consentimento concedido anteriormente para a guarda das informações.</li>
					</ul>
					<p class="mt-2 text-sm text-slate-500">
						Para exercer quaisquer destes direitos, os titulares podem entrar em contato diretamente com o suporte técnico da plataforma ou solicitar a remoção direta de seus registros aos noivos administradores do evento.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">7. Uso de Cookies e Tecnologias de Rastreamento</h2>
					<p>
						Utilizamos cookies técnicos essenciais para manter o usuário autenticado na sessão e gerenciar as preferências do tema configurado. Não fazemos uso de cookies invasivos ou de rastreamento direcionado (*retargeting*).
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">8. Fale Conosco</h2>
					<p>
						Se houver qualquer dúvida ou preocupação sobre como tratamos seus dados pessoais, você pode nos contatar por meio do e-mail de atendimento da plataforma.
					</p>
				</section>
			</article>

			<!-- Footer info -->
			<div class="text-center text-xs text-slate-400 font-light">
				&copy; {{ currentYear }} Wedding Gift. Todos os direitos reservados.
			</div>
		</main>
	</div>
</template>
