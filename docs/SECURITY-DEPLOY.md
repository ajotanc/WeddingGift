# Deploy das correções de segurança

O código já está pronto. Faltam ajustes no Appwrite que precisam ser feitos por você
(no Console ou no `appwrite.json` + `appwrite push`). **Siga a ordem abaixo**: o
frontend novo depende das tabelas e Functions novas.

## 1. Banco de dados (Console → Databases, ou `appwrite.json`)

### Permissões das tabelas existentes

Em todas as tabelas, remova `update("users")` e `delete("users")` do nível da tabela.
Quem pode editar cada linha passa a ser definido na própria linha.

| Tabela | Permissões da tabela |
|---|---|
| `tenants`, `products`, `product_links`, `faqs`, `schedules`, `quizzes`, `gallery`, `guests`, `rsvps`, `messages` | `create("users")`, `read("any")` |
| `purchases` | nenhuma (só as Functions criam; a linha diz quem lê) |
| `consent_logs` | `create("users")` |

Mantenha **Row security** ligado em todas.

### Tabelas novas (Row security ligado, sem permissões na tabela)

| Tabela | Colunas (todas `string`, opcionais) |
|---|---|
| `tenant_secrets` | `mp_user_id` (64), `mp_access_token` (1024, **encrypt**), `mp_refresh_token` (1024, **encrypt**) |
| `subscriptions` | `plan` (32), `premium_until` (64), `last_payment_id` (64) |
| `processed_payments` | `type` (32), `status` (32), `tenant` (64) |

Depois da migração, as colunas `mp_access_token` e `mp_refresh_token` da tabela
`tenants` podem ser apagadas.

## 2. Storage (bucket `General`)

- Ligue **File security**.
- Permissões do bucket: só `create("users")` e `read("any")`.

## 3. Functions

| Function | Execute | Variáveis |
|---|---|---|
| `app-actions` (**nova**, pasta `functions/app-actions`, Node 22, entrypoint `src/main.js`) | `users` | `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, `APPWRITE_BUCKET_ID` |
| `mp-oauth` | `users` (era `any`) | + `APPWRITE_DATABASE_ID` |
| `mp-payment-create` | `users` (era `any`) | + `APP_ALLOWED_HOSTS` (opcional, padrão `eternosim.com.br,eternosim.ajotanc.com.br,localhost`) |
| `mp-webhook` | `any` | + `MP_WEBHOOK_SECRET` (a "assinatura secreta" do webhook no painel do Mercado Pago) |
| `ai-helper` | sem mudança (só foi removida a ação `claim-product`) | — |

A chave `APPWRITE_API_KEY` precisa dos escopos: `users.read`, `teams.read`,
`teams.write`, `rows.read`, `rows.write` (ou `documents.*`), `files.read`, `files.write`.

## 4. Migração dos dados existentes

```bash
APPWRITE_ENDPOINT=https://api.ajotanc.com.br/v1 \
APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
APPWRITE_DATABASE_ID=... APPWRITE_BUCKET_ID=... \
node scripts/migrate-security.mjs          # simulação: só mostra o que vai mudar

node scripts/migrate-security.mjs --apply  # grava
```

O script cria o time de cada casal, move os tokens do Mercado Pago para
`tenant_secrets`, copia o Premium atual para `subscriptions` e reescreve as
permissões de linhas e arquivos. No final ele **lista os casais Premium**: confira
com os pagamentos reais, porque até agora qualquer casal conseguia se dar Premium.

## 5. Frontend

Faça o deploy do site normalmente.

## 6. Depois do deploy

- **Revogue a chave da SerpAPI** que está no histórico do git (`VITE_SERPAPI_KEY` no
  primeiro commit) e as chaves do Firebase, se ainda existirem.
- **Sessão (Auth → Security):** a sessão dura 15 dias fixos e o limite é 10 sessões.
  Aumentar a duração (30 a 90 dias) reduz os pedidos de login.
- Os tokens do Mercado Pago ficaram públicos até agora. Peça aos casais conectados
  para desconectar e conectar de novo (isso gera tokens novos).

## Teste rápido (de preferência num projeto de homologação)

1. Convidado: confirmar presença, deixar recado com áudio, curtir e descurtir, apagar o próprio recado.
2. Outro convidado: tentar apagar esse recado (deve falhar).
3. Casal: criar produto com links (os links precisam aparecer na página pública), apagar recado de convidado.
4. Co-administrador: entrar e editar um produto.
5. Presente: confirmar por link e por PIX estático; pagar um PIX do Mercado Pago e ver o webhook marcar o presente uma vez só.
6. Assinatura: checkout abre; o plano só muda depois do pagamento aprovado.
