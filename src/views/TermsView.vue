<script setup lang="ts">
import { ArrowLeft, Scale } from "lucide-vue-next";
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
					<Scale class="w-6 h-6" />
				</div>
				<h1 class="text-3xl md:text-4xl font-serif text-slate-900 leading-tight">Termos de Uso</h1>
				<p class="text-slate-500 font-light text-base md:text-lg max-w-2xl leading-relaxed">
					Ao acessar ou utilizar a nossa plataforma, você concorda com estes termos de serviço. Por favor, leia-os com atenção.
				</p>
			</div>

			<!-- Document Body -->
			<article class="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8 text-slate-600 leading-relaxed font-light">
				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">1. Aceitação dos Termos</h2>
					<p>
						Ao se cadastrar ou utilizar os serviços do <strong>Wedding Gift</strong> (incluindo o envio de mensagens, confirmação de presença (RSVP) ou compra de presentes), você expressa seu consentimento livre e expresso aos presentes Termos de Uso. Caso não concorde com qualquer disposição, você não deve utilizar a plataforma.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">2. Descrição dos Serviços</h2>
					<p>
						O <strong>Wedding Gift</strong> funciona como um facilitador digital para eventos de casamento, permitindo a criação de páginas de convites personalizadas, gerenciamento de listas de convidados (RSVP), murais de recados e cotas de presentes integradas via PIX ou links externos.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">3. Cadastro e Segurança de Conta</h2>
					<p>
						Para utilizar determinados recursos (como dar presentes e RSVP), os convidados devem se identificar, geralmente por meio de autenticação social (Google OAuth). Você é responsável pela precisão e veracidade dos dados fornecidos. A plataforma adota medidas técnicas de segurança adequadas para proteger essas informações contra acessos não autorizados.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">4. Lista de Presentes e Transações Financeiras</h2>
					<ul class="list-disc pl-6 space-y-2">
						<li>
							<strong>Cotas de Presente (PIX):</strong> As cotas são pagas diretamente de convidado para a chave PIX do casal cadastrado. O Wedding Gift gera a carga útil (Payload) e o QR Code de pagamento, mas não atua como intermediário financeiro retendo valores.
						</li>
						<li>
							<strong>Links de Lojas Externas:</strong> Para presentes em lojas parceiras, o Wedding Gift redireciona o convidado para o link externo. Toda a compra, entrega e termos associados à transação são de responsabilidade exclusiva da loja terceira escolhida.
						</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">5. Mural de Recados e Conduta</h2>
					<p>
						Ao publicar mensagens na plataforma, você garante que possui os direitos sobre o conteúdo enviado e concorda em não postar nada ofensivo, difamatório, abusivo ou ilegal. Os noivos e os administradores do sistema reservam-se o direito de remover qualquer conteúdo que viole estas diretrizes sem aviso prévio.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">6. Propriedade Intelectual</h2>
					<p>
						Todos os materiais, logos, design do sistema, marcas e códigos da plataforma Wedding Gift são de nossa propriedade intelectual ou de nossos licenciadores. O uso não autorizado destes elementos é estritamente proibido.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">7. Limitação de Responsabilidade</h2>
					<p>
						A plataforma é fornecida "como está". Não nos responsabilizamos por falhas técnicas temporárias de conexão, transações financeiras incorretas por erro de digitação de chaves PIX de responsabilidade dos noivos, ou divergências de produtos em lojas parceiras.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">8. Alterações nos Termos</h2>
					<p>
						Podemos atualizar estes Termos de Uso periodicamente. A versão mais atualizada estará sempre publicada nesta URL. O uso continuado da plataforma após as alterações constituirá sua aceitação implícita das novas regras.
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
