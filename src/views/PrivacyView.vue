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
				<span class="text-xs text-slate-400 font-light">Última atualização: Junho de {{ currentYear }} | Versão: 1.0</span>
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
					<h2 class="text-xl font-serif text-slate-900 font-medium">1. Quem somos</h2>
					<p>
						Esta Política de Privacidade descreve como o <strong>WeddingGift</strong> ("WeddingGift", "nós", "nossa plataforma"), coleta, usa, armazena, compartilha e protege dados pessoais de quem utiliza o site e o aplicativo de listas de presentes, RSVP e cotas de lua de mel.
					</p>
					<p>
						Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e, no que for aplicável a usuários fora do Brasil, busca observar também princípios do Regulamento Geral de Proteção de Dados da União Europeia (GDPR).
					</p>
					<p>
						Ao usar o WeddingGift — seja como casal organizando sua lista de presentes, seja como convidado confirmando presença ou presenteando — você concorda com as práticas descritas aqui.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">2. Quem usa o WeddingGift e quais dados coletamos</h2>
					<p>
						O WeddingGift é uma plataforma multi-tenant: cada casal tem seu próprio espaço (<code>/seu-slug</code>), e convidados interagem com esse espaço público. Por isso, tratamos dois grupos de titulares de forma diferente.
					</p>

					<h3 class="text-lg font-serif text-slate-900 font-medium mt-4">2.1. Dados do Casal (conta/administração)</h3>
					<p>Quando você cria uma conta para organizar sua lista de presentes, coletamos:</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Nome completo e e-mail (login, inclusive via Google OAuth)</li>
						<li>Foto de perfil (quando vinda do login social)</li>
						<li>Chave PIX cadastrada para recebimento de presentes em dinheiro/cotas</li>
						<li>Dados de configuração da conta Mercado Pago, quando você conecta sua conta para recebimento de pagamentos (via OAuth — nunca armazenamos sua senha do Mercado Pago)</li>
						<li>Conteúdo que você cadastra: nome dos noivos, data do casamento, lista de produtos desejados, cotas de experiências, tema visual da página</li>
					</ul>

					<h3 class="text-lg font-serif text-slate-900 font-medium mt-4">2.2. Dados dos Convidados</h3>
					<p>Quando um convidado acessa a página pública de um casal para confirmar presença ou presentear, podemos coletar:</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Nome completo, e-mail e telefone (formulário de RSVP)</li>
						<li>Número de acompanhantes adultos e número de crianças acompanhantes (em formato agregado — <strong>não coletamos nome, idade ou qualquer dado individualmente identificável de crianças</strong> no fluxo padrão)</li>
						<li>Status de confirmação de presença</li>
						<li>Mensagens de texto deixadas no mural de recados</li>
						<li>Dados de login social (Google), quando o convidado opta por se autenticar para reservar um presente</li>
						<li>Registro de quais presentes/cotas foram reservados ou contribuídos (sem armazenar dados de cartão de crédito ou senha bancária — pagamentos via PIX são processados fora da nossa infraestrutura, diretamente entre convidado e casal)</li>
					</ul>

					<h3 class="text-lg font-serif text-slate-900 font-medium mt-4">2.3. Dados coletados automaticamente</h3>
					<p>Como em qualquer aplicação web, coletamos automaticamente:</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Endereço IP, tipo de navegador e dispositivo</li>
						<li>Logs de acesso e uso, para fins de segurança e prevenção de fraude/abuso</li>
						<li>Cookies estritamente necessários para manter sua sessão autenticada</li>
					</ul>
					<p>Não utilizamos cookies de rastreamento publicitário nem vendemos dados de navegação a terceiros.</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">3. Por que coletamos esses dados (finalidades e bases legais)</h2>
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left text-slate-500 border-collapse">
							<thead>
								<tr class="border-b border-slate-200 text-slate-900">
									<th class="py-2 font-semibold">Dado</th>
									<th class="py-2 font-semibold">Finalidade</th>
									<th class="py-2 font-semibold">Base legal (LGPD)</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Nome, e-mail, telefone do convidado (RSVP)</td>
									<td class="py-3 pr-4">Permitir que o casal organize a recepção</td>
									<td class="py-3">Execução de procedimento preliminar/solicitado pelo titular (Art. 7º, V) e consentimento</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Contagem de crianças acompanhantes</td>
									<td class="py-3 pr-4">Planejamento de cerimônia/recepção pelo casal</td>
									<td class="py-3">Consentimento do convidado responsável</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Mensagens do mural</td>
									<td class="py-3 pr-4">Funcionalidade social do produto, escolhida pelo convidado</td>
									<td class="py-3">Consentimento</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Chave PIX do casal</td>
									<td class="py-3 pr-4">Viabilizar o recebimento de presentes/cotas</td>
									<td class="py-3">Execução de contrato (Art. 7º, V) + consentimento explícito para exibição pública</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Login Google (casal e convidado)</td>
									<td class="py-3 pr-4">Autenticação segura, sem necessidade de senha própria</td>
									<td class="py-3">Consentimento + execução de contrato</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Dados de conta Mercado Pago</td>
									<td class="py-3 pr-4">Processar split de pagamentos solicitado pelo casal</td>
									<td class="py-3">Execução de contrato</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Logs de acesso e IP</td>
									<td class="py-3 pr-4">Segurança, prevenção de fraude e abuso</td>
									<td class="py-3">Legítimo interesse (Art. 7º, IX) e cumprimento de obrigação legal</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Texto gerado por IA (agradecimentos)</td>
									<td class="py-3 pr-4">Sugestão de mensagem de agradecimento para o casal revisar</td>
									<td class="py-3">Consentimento + execução de contrato</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="mt-2">
						Você pode retirar seu consentimento a qualquer momento, sem prejuízo da licitude do tratamento realizado anteriormente — ver seção 11.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">4. Quem é o controlador dos seus dados</h2>
					<p>
						Esse ponto é importante e específico de como nossa plataforma funciona:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>
							Para os <strong>dados da conta do casal</strong> (login, configurações, chave PIX, dados de pagamento), o <strong>WeddingGift é o controlador</strong> dos dados, nos termos do Art. 5º, VI da LGPD.
						</li>
						<li>
							Para os <strong>dados dos convidados</strong> coletados através da página pública de um casal (RSVP, mensagens do mural), o <strong>casal é o controlador</strong> desses dados — é ele quem decide coletar essas informações e para qual finalidade (organizar seu próprio casamento). O <strong>WeddingGift atua como operador</strong> (Art. 5º, VII), isto é, fornecemos a infraestrutura técnica que processa esses dados em nome do casal, seguindo as instruções dadas pelo desenho da própria plataforma.
						</li>
					</ul>
					<p>
						Na prática, isso significa que: se você é convidado e quer corrigir ou excluir seus dados de RSVP, pode pedir diretamente ao casal ou a nós — atenderemos a solicitação de qualquer forma, repassando ao casal quando necessário.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">5. Com quem compartilhamos dados</h2>
					<p>
						Não vendemos dados pessoais. Compartilhamos dados apenas com prestadores de serviço estritamente necessários para o funcionamento da plataforma ("operadores" e "suboperadores"):
					</p>
					<div class="overflow-x-auto">
						<table class="w-full text-sm text-left text-slate-500 border-collapse">
							<thead>
								<tr class="border-b border-slate-200 text-slate-900">
									<th class="py-2 font-semibold">Terceiro</th>
									<th class="py-2 font-semibold">Finalidade</th>
									<th class="py-2 font-semibold">Dados envolvidos</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Google (OAuth / Identity)</td>
									<td class="py-3 pr-4">Autenticação social</td>
									<td class="py-3">Nome, e-mail, foto de perfil</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Google (Gemini API)</td>
									<td class="py-3 pr-4">Geração assistida de mensagens de agradecimento</td>
									<td class="py-3">Nome do convidado, nome do presente — <strong>nunca dados financeiros</strong></td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Mercado Pago</td>
									<td class="py-3 pr-4">Processamento de split de pagamento, quando habilitado pelo casal</td>
									<td class="py-3">Identificador de conta conectada, valores de transação</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Serper (Google Shopping)</td>
									<td class="py-3 pr-4">Busca de preços de produtos para a lista de presentes</td>
									<td class="py-3">Termo de busca digitado pelo casal — sem dados pessoais de convidados</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Provedor de hospedagem</td>
									<td class="py-3 pr-4">Armazenamento e processamento de todos os dados da aplicação (Appwrite)</td>
									<td class="py-3">Todos os dados da plataforma</td>
								</tr>
								<tr>
									<td class="py-3 pr-4 font-medium text-slate-900">Cloudflare</td>
									<td class="py-3 pr-4">Proteção contra abuso/DDoS e segurança de rede</td>
									<td class="py-3">IP, metadados de requisição</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="mt-2 text-xs text-slate-400">
						Cada um desses terceiros possui sua própria política de privacidade e é contratualmente obrigado a tratar os dados apenas para a finalidade contratada.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">6. Transferência internacional de dados</h2>
					<p>
						Alguns dos prestadores listados acima (Google, em especial) processam dados em servidores fora do Brasil, incluindo nos Estados Unidos. Essa transferência internacional é realizada com base em mecanismos reconhecidos pela LGPD (Art. 33), como cláusulas-padrão contratuais adotadas pelos próprios provedores em seus termos de serviço.
					</p>
					<p>
						Se você está localizado na União Europeia: a UE é reconhecida como provedora de nível adequado de proteção de dados para fins de transferência entre Brasil e UE, o que simplifica (mas não elimina) as garantias contratuais para esse fluxo específico.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">7. Por quanto tempo guardamos seus dados</h2>
					<ul class="list-disc pl-6 space-y-2">
						<li>
							<strong>Dados da conta do casal:</strong> mantidos enquanto a conta estiver ativa, e por até 90 dias após solicitação de exclusão, salvo obrigação legal de retenção maior (ex: dados de transação financeira, que podem exigir retenção por prazo fiscal/regulatório).
						</li>
						<li>
							<strong>Dados de RSVP e mensagens de convidados:</strong> mantidos enquanto o evento/conta do casal estiver ativo. O casal pode excluir esses dados a qualquer momento pelo painel administrativo.
						</li>
						<li>
							<strong>Logs de segurança e acesso:</strong> mantidos por até 6 meses, prazo razoável para fins de investigação de incidentes.
						</li>
					</ul>
					<p>
						Ao final do prazo aplicável, os dados são excluídos ou anonimizados de forma irreversível.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">8. Como protegemos seus dados</h2>
					<p>
						Adotamos medidas técnicas e organizacionais para proteger os dados pessoais sob nossa responsabilidade, incluindo:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li>Criptografia em trânsito (TLS) em todas as comunicações entre seu navegador e nossos servidores</li>
						<li>Controle de acesso por permissão, isolando os dados de cada casal (tenant) dos demais</li>
						<li>Segredos e chaves de API mantidos exclusivamente em ambiente de servidor, nunca expostos no código do site</li>
						<li>Backups periódicos e criptografados da infraestrutura</li>
						<li>Princípio de privilégio mínimo no acesso administrativo à infraestrutura</li>
					</ul>
					<p>
						Nenhum sistema é 100% imune a incidentes. Caso ocorra um incidente de segurança que possa gerar risco ou dano relevante aos titulares, comunicaremos a Autoridade Nacional de Proteção de Dados (ANPD) e os titulares afetados dentro do prazo legal aplicável, atualmente de 3 (três) dias úteis a partir do conhecimento do incidente.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">9. Dados de crianças e adolescentes</h2>
					<p>
						O WeddingGift não é direcionado a crianças e não permite que menores de idade criem contas. O único dado relacionado a crianças tratado pela plataforma é a <strong>contagem agregada</strong> de crianças acompanhantes informada por um responsável adulto no formulário de RSVP — não coletamos nome, data de nascimento, foto ou qualquer outro dado individualmente identificável de menores.
					</p>
					<p>
						Esse tratamento é realizado com base no consentimento do responsável adulto que preenche o formulário, em conformidade com o Art. 14 da LGPD e com as diretrizes do ECA Digital (Lei nº 15.211/2025). Caso você seja pai/mãe/responsável e identifique qualquer dado de seu filho tratado de forma inadequada por nossa plataforma, entre em contato imediatamente pelo canal da seção 12.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">10. Cookies e tecnologias semelhantes</h2>
					<p>
						Utilizamos apenas cookies estritamente necessários ao funcionamento do site (manutenção de sessão de login). Não utilizamos cookies de rastreamento publicitário ou de redes sociais de terceiros para fins de marketing. Caso isso mude no futuro, esta política será atualizada e, quando exigido por lei, solicitaremos seu consentimento antes da ativação.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">11. Seus direitos como titular de dados</h2>
					<p>
						Nos termos do Art. 18 da LGPD, você tem direito a:
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li><strong>Confirmação</strong> da existência de tratamento dos seus dados</li>
						<li><strong>Acesso</strong> aos dados que temos sobre você</li>
						<li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados</li>
						<li><strong>Eliminação</strong> dos dados tratados com base em consentimento</li>
						<li><strong>Portabilidade</strong> dos seus dados a outro fornecedor de serviço</li>
						<li><strong>Informação</strong> sobre com quem compartilhamos seus dados</li>
						<li><strong>Revogação do consentimento</strong>, a qualquer momento</li>
						<li><strong>Oposição</strong> a tratamento realizado com base em legítimo interesse, quando aplicável</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">12. Como exercer seus direitos</h2>
					<p>
						Para exercer qualquer um dos direitos acima, ou para tirar dúvidas sobre esta política, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
					</p>
					<ul class="list-disc pl-6 space-y-2">
						<li><strong>E-mail de Contato:</strong> suporte@weddinggift.com.br</li>
						<li><strong>Prazo de resposta:</strong> buscamos responder em até 15 dias, conforme a complexidade do pedido.</li>
					</ul>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">13. O que fazemos em caso de incidente de segurança</h2>
					<p>
						Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares de dados, adotaremos as seguintes medidas: (i) contenção imediata do incidente; (ii) avaliação do impacto e dos dados afetados; (iii) comunicação à ANPD e aos titulares afetados, dentro do prazo legal vigente; (iv) adoção de medidas corretivas para evitar reincidência.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">14. Alterações nesta política</h2>
					<p>
						Podemos atualizar esta política periodicamente para refletir mudanças na plataforma ou na legislação aplicável. A data da última atualização está sempre indicada no topo deste documento. Alterações relevantes serão comunicadas por e-mail ou aviso destacado no site antes de entrarem em vigor.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-xl font-serif text-slate-900 font-medium">15. Legislação aplicável e foro</h2>
					<p>
						Esta política é regida pelas leis da República Federativa do Brasil, em especial a Lei nº 13.709/2018 (LGPD). Fica eleito o foro da Capital para dirimir quaisquer controvérsias decorrentes desta política, com renúncia a qualquer outro, por mais privilegiado que seja.
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
