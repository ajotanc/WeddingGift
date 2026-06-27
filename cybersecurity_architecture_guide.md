# Guia de Arquitetura de Cibersegurança & Observabilidade

Este documento detalha o framework conceitual de cibersegurança e observabilidade estruturado para garantir a integridade de dados, controles de acesso rígidos, auditoria de consentimento e imunidade a vetores de ataque comuns em aplicações SaaS multi-tenant modernas.

---

## 1. Prevenção de BOLA (Broken Object Level Authorization) / IDOR

O acesso direto de APIs de cliente a bancos de dados é comum em plataformas do tipo Backend-as-a-Service (BaaS), mas impõe riscos sérios de BOLA se os privilégios de escrita ou atualização não forem limitados.

### Arquitetura de Mitigação:
* **Remoção de Permissões de Escrita Amplas no Cliente:** Qualquer ação que precise alterar um documento pertencente a outro tenant (por exemplo, incrementar a contagem de itens reservados) nunca deve permitir atualizações diretas via SDK do cliente. O privilégio de escrita direta é removido dos usuários públicos (mudando de `Role.any()` para `Role.user(owner)`).
* **Delegação a Proxies Seguros (Serverless Functions):** As atualizações de dados sensíveis são direcionadas a uma função serverless intermediária (backend proxy).
* **Validação de Limites e Estado no Servidor:**
  1. A função serverless lê o documento existente diretamente do banco usando credenciais de administrador.
  2. Valida se a alteração solicitada pelo cliente é permitida (por exemplo, garante que o valor modificado apenas cresça e que não exceda o limite total planejado pelo dono do recurso).
  3. Rejeita payloads fraudulentos com status `400 Bad Request` antes de persistir o documento.
  4. Executa a gravação segura no servidor.

---

## 2. Controle de Acesso e RLS (Row-Level Security)

A aplicação do princípio do menor privilégio garante que tenants acessem apenas seus próprios dados.

### Estrutura Necessária:
* **Habilitação de Segurança ao Nível de Documento (RLS):** Toda coleção de banco de dados deve habilitar a checagem individual de documentos (Document-Level Security).
* **Geração de Permissões Dinâmicas por Documento:** Ao criar registros, o backend anexa permissões específicas de leitura, escrita e exclusão limitadas às identidades exatas dos envolvidos:
  * **Dono do Tenant:** Acesso total (CRUD).
  * **Convidado Vinculado:** Permissões de leitura e escrita restritas à sua sessão autenticada.
* **Isolamento de Rotas no Frontend:** Guards de navegação na rota client-side validam a sessão do usuário ativo em tempo real e redirecionam tentativas de acesso a slugs ou diretórios de outros tenants.

---

## 3. Higienização contra Injeção de Scripts (XSS)

Aplicações que permitem a edição de textos ricos no painel administrativo podem expor visitantes a ataques de XSS Armazenado (Stored XSS) se os outputs forem renderizados sem tratamento.

### Estrutura Necessária:
* **Sanitização Proativa na Renderização (`v-html` / `innerHTML`):** Todos os dados inseridos por usuários que contenham tags HTML devem passar obrigatoriamente por uma biblioteca de higienização do lado do cliente (como o **DOMPurify**) antes de serem exibidos.
* **Neutralização de Elementos Maliciosos:** O processo de sanitização neutraliza payloads comuns (como tags `<script>` ou manipuladores inline do tipo `onerror`, `onload` em imagens).

---

## 4. Proteção de Credenciais e Secrets

* **Secrets no Backend:** Chaves de API externas (ex: modelos de linguagem, motores de busca, credenciais de pagamentos) nunca são expostas ao frontend.
* **Armazenamento Seguro:** As chaves de acesso permanecem salvas estritamente nas variáveis de ambiente seguras do provedor de nuvem ou servidor de aplicação, sendo acessíveis apenas pelas funções de backend.

---

## 5. Observabilidade e Logs Estruturados Seguros (Data Masking)

Logs claros são cruciais para auditoria, mas logs mal estruturados geram pontos cegos, enquanto o vazamento de dados sensíveis viola conformidades como LGPD e GDPR.

### Requisitos Implementados:

### A. Estrutura JSON (Logs Estruturados)
Todos os logs de servidor são gravados em formato JSON padronizado para permitir a indexação automática por indexadores de logs:
```json
{
  "level": "INFO",
  "timestamp": "2026-06-22T20:50:00.000Z",
  "requestId": "req-xyz123",
  "userId": "usr_90a",
  "action": "claim-product",
  "message": "Product claimed successfully",
  "metadata": {}
}
```

### B. Propagação de Contexto
Cada log carrega três chaves fundamentais:
1. `requestId`: Código aleatório de rastreamento gerado na chegada da requisição.
2. `userId`: Identificação do usuário autenticado solicitante.
3. `action`: Nome da operação do sistema sendo realizada.

### C. Sanitização e Mascaramento de Dados (Data Masking)
Para evitar que dados sensíveis (PII) cheguem aos arquivos de log, o sistema implementa um filtro recursivo de propriedades com base em uma lista negra:
* **Campos Mascarados:** Senhas (`password`), tokens de acesso (`token`, `access_token`), segredos de autenticação e chaves de pagamento (`pix_key`, `refresh_token`).
* **Comportamento:** Qualquer dado associado a estas chaves é automaticamente substituído por `[REDACTED_PII]` antes de ser escrito em stdout/stderr.

### D. Separação de Níveis (Severity Levels)
O logger separa as saídas por gravidade:
* `INFO`: Fluxo normal da aplicação.
* `WARN`: Comportamentos inesperados, timeouts de APIs externas ou tentativas suspeitas de acesso.
* `ERROR`: Exceções capturadas em blocos try/catch críticos.
* `FATAL`: Erros que impedem a inicialização ou continuidade do serviço.
