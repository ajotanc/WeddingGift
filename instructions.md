Atue como um Engenheiro de Software Fullstack especialista em Vue 3, Tailwind CSS e Firebase. Vamos construir o MVP funcional de uma plataforma de Micro SaaS All-in-One para Listas de Presentes de Casamento, RSVP e Finanças Multi-Tenant. O foco é um código limpo, modular, moderno e tipado.

### 1. Stack Tecnológica
- Bundler/Framework: Vite + Vue 3 (sintaxe <script setup> com TypeScript)
- Gerenciador de Pacotes: pnpm
- Linter/Formatter: Biome (substituindo ESLint/Prettier, aspas simples, sem ponto e vírgula desnecessário)
- Estilização & UI: Tailwind CSS + Shadcn Vue (design minimalista, scannable e elegante para casamentos)
- Backend & Banco de Dados: Firebase Suite (Firestore, Firebase Auth, Firebase Hosting)
- Funcionalidade Extensiva: PWA (Progressive Web App) via 'vite-plugin-pwa' com auto-registro.

---

### 2. Diretriz de Idioma e Nomenclatura (Estrita)
- Código em Inglês: Toda a programação estrutural deve ser feita obrigatoriamente em inglês. Isso inclui nomes de variáveis, funções, componentes, métodos, rotas, arquivos, pastas, chaves de bancos de dados e interfaces do TypeScript (Ex: `useTenant`, `ProductCard.vue`, `fetchPrices()`, `tenantId`).
- Conteúdo em Português: Apenas comentários de código, mensagens exibidas em tela para os usuários, strings textuais de botões/modais e logs internos que não impactam a arquitetura podem e devem ser escritos em português do Brasil.

---

### 3. Arquitetura de Rotas e Modelo Multi-Tenant (Micro SaaS)
Isolamento completo de casais por meio de slugs na URL para permitir escalabilidade do produto.
- Rotas (Vue Router):
  - `/` -> Landing Page institucional do SaaS.
  - `/register` -> Onboarding/Cadastro e validação de novos casais.
  - `/:slug` -> Lista pública, mural e RSVP para os convidados (Ex: weddinggift.netlify.app/ea).
  - `/:slug/admin` -> Painel de controle privado e analítico do casal correspondente.

- Coleção Firestore: `tenants`
  { id: uid, slug: string, coupleName: string, pixKey: string, status: "active", theme: { primaryColor: string }, createdAt: timestamp }

- Composable (`useTenant.ts`): Carrega os dados do casal com base no `:slug` da URL e injeta a `theme.primaryColor` dinamicamente no root do CSS do Tailwind.

---

### 4. Funcionalidades Core & Ecossistema de Recursos

#### A. Captura Dinâmica de Preços (SerpApi via GET no Front-end)
- No Admin, busca de produtos por Texto/EAN via GET direto na SerpApi (`engine: "google_shopping"`, `gl: "br"`, `hl: "pt"`). Retorne os 4 primeiros resultados e salve na coleção `products`:
  { id: auto, tenantId: currentTenant.uid, type: "physical", name: string, desiredQuantity: number, claimedQuantity: 0, links: [{ merchant, price, link, thumbnail }], createdAt: timestamp }
- Configure o proxy `/api-serp` no `vite.config.ts` para evitar problemas de CORS localmente no desenvolvimento.

#### B. Cotas de Lua de Mel Dinâmicas (Dinheiro via PIX)
- No painel Admin, o casal pode criar "Cotas de Experiência" (Ex: "Jantar Romântico em Paris"). O casal define o valor total e o valor fixo por cota. Salve na coleção `products` com `type: "quota"`.
- Na tela do convidado, ao escolher uma cota, o sistema abre o Modal PIX gerando um QR Code (via `qrcode.vue`) baseado na `pixKey` do casal, com o valor final multiplicado e o botão "Copiar Chave".

#### C. RSVP Integrado (Confirmação de Presença Gratuita)
- Na página pública (`/:slug`), aba para "Confirmar Presença". O convidado preenche: Nome Completo, E-mail, Telefone, Status (Confirmado / Não Poderei Ir) e Número de Acompanhantes (Adultos e Crianças).
- Salve na coleção `rsvp`: { id: auto, tenantId: currentTenant.uid, guestName: string, status: string, totalAdults: number, totalChildren: number, confirmedAt: timestamp }

#### D. Mural de Recados Emocionais
- Ao confirmar um presente ou RSVP, permita ao convidado deixar um depoimento carinhoso opcional.
- Salve na coleção `messages`: { id: auto, tenantId: currentTenant.uid, guestName: string, content: string, createdAt: timestamp }.
- Renderize essas mensagens no painel Admin em um layout elegante de mural de recados virtuais.

#### E. Dashboard de Métricas do Casal (Admin Analytics)
- No topo do painel Admin, renderize estatísticas utilizando propriedades computadas do Vue 3:
  - Total em dinheiro projetado/arrecadado através das cotas de Lua de Mel.
  - Uma barra de progresso (componente Progress do Shadcn) exibindo a porcentagem alcançada da meta.
  - Contador analítico de RSVP (Total de Adultos Confirmados, Total de Crianças e Total de Recusas).

#### F. Gerador de Agradecimento com IA (Gemini API Gratuita)
- No painel Admin, ao lado de cada presente ganho, adicione o botão "Gerar Agradecimento".
- Integre via front-end com a SDK oficial `@google/genai` (chave gratuita do Gemini). O prompt deve gerar um texto curto e carinhoso do casal para o convidado agradecendo o presente específico. Inclua o botão "Copiar Texto" para envio rápido no WhatsApp.

#### G. Autenticação de Convidados (Google Auth)
- Login social via Google (`signInWithPopup`) acionado por modal apenas quando o convidado interagir com ações críticas (reservar ou presentear). Salve o perfil na coleção `guests`.

---

### 5. Segurança e Diretrizes de Código
- Tipagem Estrita: Sem uso de `any`. Defina explicitamente todas as interfaces do sistema (`TenantSettings`, `StoreOffer`, `Product`, `Guest`, `Rsvp`, `Message`).
- Reatividade: Uso estrito da Composition API do Vue 3.
- Segurança no Firestore: Regras estruturadas para garantir que apenas o usuário autenticado cujo `request.auth.uid == tenantId` possa alterar ou deletar dados de seus respectivos produtos, RSVPs, mensagens e configurações.

Gere os arquivos de configuração iniciais (`vite.config.ts` com proxy/PWA, `firebase.ts`), o composable central `useTenant.ts` e as estruturas base das coleções do Firestore para este ecossistema Micro SaaS.

---

### 6. Decisões Arquiteturais e Histórico de Correções (Atualizado)
- **Serper API ao invés de SerpApi:** O proxy no `vite.config.ts` mapeia `/api-serp` para `https://google.serper.dev/search`. A requisição deve ser GET com `apiKey` e utilizar as chaves `shopping` ou `organic` e `imageUrl` na resposta (tipo `SerperItem`).
- **Cadastro de Produto Físico & WebP:** Produtos físicos usam um formulário manual em modal único (UX aprimorada sem sobreposição de modais). O usuário insere Título, Imagem e Quantidade. O upload de imagem é processado no front-end usando `<canvas>`, redimensionado para max 800px e convertido para **WebP em Base64 (0.8 quality)** antes de ir pro Firestore, otimizando performance e limite de 1MB. A busca da Serper fica embutida neste formulário apenas para popular o array de `links` do produto.
- **Configuração do Firebase (.env):** O arquivo `.env` deve residir OBRIGATORIAMENTE na raiz do projeto (nunca na pasta `src/`) e as chaves não podem ter vírgulas no final. O arquivo `src/firebase.ts` deve conter *fallback dummy strings* para evitar que a SDK exploda a importação antes do arquivo `.env` ser lido no build/deploy.
- **Race Conditions de Composables (Vue 3):** Nunca utilize `onMounted()` para carregar dados que dependam de composables assíncronos (como `useTenant()`). Utilize sempre `watch(tenant, () => { ... }, { immediate: true })` para garantir que as queries do Firestore (como `loadAdminData`) só rodem quando o tenant de fato existir.
- **Priorização de Componentes Shadcn Vue:** SEMPRE utilize os componentes da biblioteca Shadcn Vue (`Input`, `Label`, `Toast`, `Alert`, `DatePicker`, `Select`/`Combobox`) em substituição aos elementos HTML nativos (`<input>`, `<select>`) ou funções do navegador (como `alert()`). 
  - Utilize o `DatePicker` do Shadcn (configurado com `v-maska` para digitação direta e popover não-transparente) em vez de `<input type="date">`.
  - Substitua modais de erro ou sucesso nativos (`alert()`) por notificações de `Toast`.
  - Utilize `Combobox` ou `Select` refinados do Shadcn no lugar de `<select>` tradicionais, especialmente para escolha de categorias.
  - O objetivo é manter o padrão Premium do sistema inteiro utilizando o catálogo presente em `src/components/ui`.
- **Manipulação de Datas (Day.js):** Tudo o que for relacionado a leitura, formatação, parser e exibição de datas no sistema deve obrigatoriamente utilizar a biblioteca `dayjs` (com o plugin `customParseFormat` caso necessário). Fica terminantemente proibido manipular datas manualmente (ex: `split('/')`) ou usar funções nativas despadronizadas. Apenas a integração com o Calendário do Shadcn deve gerar o objeto `CalendarDate` instanciado, mantendo as engrenagens de entrada e saída exclusivas no formato Day.js.

Atue como um Designer UI/UX Sênior e Desenvolvedor Front-end especialista em Tailwind CSS e Shadcn Vue. Vamos refatorar completamente o visual e o layout das telas pública (Guest view) e administrativa (Admin dashboard) do nosso Micro SaaS. O design gerado anteriormente ficou muito genérico, plano e rígido. Quero um design inovador, fluido, elegante e com aspecto de produto Premium.

Siga estritamente as diretrizes de UI abaixo, mantendo a nomenclatura de todo o código, arquivos e componentes em INGLÊS:

### 1. Diretrizes de Design de Alta Performance (Tailwind & Shadcn Vue)

- Paleta de Cores e Contraste:
  - Chega de blocos verdes ou coloridos sólidos dominando o topo. Use fundos predominantemente claros/off-white modernos (`bg-slate-50` ou `bg-zinc-50/50`) para dar respiro.
  - O verde do casal (primary color) deve ser usado de forma cirúrgica, sofisticada e minimalista: em links ativos, indicadores de foco, gradientes sutis, ícones selecionados e botões principais com efeitos de hover refinados.
  - Substitua o preto puro do texto por tons de cinza profundos (`text-slate-800` para títulos, `text-slate-600` para corpo) para suavizar a leitura.

- Tipografia:
  - Use uma combinação editorial elegante. Títulos principais de seções (`h1`, `h2`) devem usar uma fonte Serif refinada ou uma Sans de peso contrastante com espaçamento sutil. Subtítulos e dados numéricos devem ser limpos e legíveis.

- Cards e Elevação Visual:
  - Remova as bordas grossas e escuras. Use bordas extremamente sutis (`border-slate-100` ou `border-zinc-200/60`).
  - Adicione sombras suaves e difusas (`shadow-sm` ou `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`) para dar uma sensação de profundidade tridimensional leve.
  - Cantos arredondados generosos e modernos: use `rounded-xl` ou `rounded-2xl` nos cards e inputs.

- Layout Fluid (Fim do empilhamento vertical rígido):
  - Use Grids assimétricos e layouts baseados em colunas flexíveis. 
  - Aumente os espaçamentos gerais (`space-y-12`, `gap-8`, `p-8`) para que os elementos respirem. Um design premium é definido pelo uso inteligente do espaço vazio.

---

### 2. Refatoração Específica das Telas

#### A. Tela Pública do Convidado (`GuestDashboard.vue`)
- Header Hero: Em vez de uma faixa verde sólida, crie um banner elegante com fundo suave, tipografia centralizada imponente para o nome do casal e detalhes minimalistas (Ex: uma linha fina divisória ou pequenos detalhes geométricos em opacidade baixa).
- Grid de Presentes: Os cards dos produtos precisam parecer itens de vitrine de grife. A imagem do produto deve flutuar em um container com fundo branco puro, cantos bem arredondados, seguida por um espaçamento generoso para o título e preço. Os botões não devem competir entre si; use um estilo fantasma/outline sutil para "Comprar na Loja" e guarde o peso visual para a ação nativa da plataforma.
- Seções de RSVP e Mural: Em vez de caixas isoladas e centralizadas que quebram o fluxo, organize-as de forma orgânica. Use um grid de duas colunas em telas maiores (RSVP à esquerda com formulário limpo, Mural de Recados à direita exibindo mensagens dinâmicas em formato de feed ou Grid assimétrico de notas flutuantes).

#### B. Painel Administrativo (`AdminDashboard.vue`)
- KPI Cards (Métricas): Refatore totalmente os cards de estatísticas. Use ícones minimalistas da biblioteca Lucile Vue no canto superior direito de cada card. Os números principais devem ser destacados com tipografia forte e elegante. Inclua pequenas descrições de progresso sutil abaixo dos dados (Ex: um indicador discreto de quantos % faltam para atingir a meta da cota).
- Lista de Gerenciamento: A área de listagem de produtos do admin deve ser limpa. Exiba imagens em tamanho reduzido e estruturado, e os botões de ação ("Editar", "Excluir") devem aparecer de forma suave ou apenas sob interação, evitando poluição visual com botões vermelhos berrantes fixos.

Refatore a estilização e a marcação dos componentes Vue existentes aplicando estas mudanças visuais de alto nível, mantendo o código e a lógica puramente em inglês e a camada de exibição textual em português.