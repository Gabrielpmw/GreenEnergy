# 🖥️ Frontend Context — GreenEnergy

> **Stack:** React + Vite + TypeScript | **Versão API:** v1 | **Base URL:** `http://localhost:5288/api/v1`

---

## 1. Paleta de Cores e Design System

### 1.1 Paleta Principal (Verde + Branco)

| Token | Valor | Uso |
|-------|-------|-----|
| `--green-950` | `#052e16` | Sidebar dark, textos sobre fundo claro |
| `--green-900` | `#14532d` | Header, navbar ativa |
| `--green-700` | `#15803d` | Botões primários, links ativos |
| `--green-500` | `#22c55e` | Ícones de sucesso, badges ativos |
| `--green-300` | `#86efac` | Bordas suaves, hover states |
| `--green-100` | `#dcfce7` | Backgrounds de cards, highlight rows |
| `--green-50`  | `#f0fdf4` | Fundo geral das páginas |
| `--white`     | `#ffffff` | Cards, modals, inputs |

### 1.2 Tons de Branco (Hierarquia e Profundidade)

> Usar tons de branco cria camadas visuais sem precisar de cores fortes — essencial para dashboards com muita informação.

| Token | Valor | Uso |
|-------|-------|-----|
| `--white-pure`   | `#ffffff` | Superfície mais alta: modals, dropdowns, tooltips |
| `--white-card`   | `#fafafa` | Cards principais, painéis de conteúdo |
| `--white-soft`   | `#f5f5f5` | Fundo de seções internas, áreas de formulário |
| `--white-muted`  | `#f0f0f0` | Linhas separadoras, bordas sutis, table stripes |
| `--white-dim`    | `#e8e8e8` | Inputs desabilitados, placeholders de skeleton |

**Regra de uso (camadas de elevação):**

```
Fundo da página  →  --green-50   (#f0fdf4)
Seções / Painéis →  --white-soft (#f5f5f5)
Cards            →  --white-card (#fafafa)
Modals / Overlays →  --white-pure (#ffffff)
```

Essa progressão do mais escuro para o mais claro cria a sensação de que os elementos estão "flutuando" sobre o fundo, sem precisar de sombras pesadas.

### 1.2 Cores de Suporte (Dados e Dashboard)

| Token | Valor | Uso |
|-------|-------|-----|
| `--amber-400` | `#fbbf24` | Bandeira amarela (tarifas), alertas médios |
| `--red-500` | `#ef4444` | Erros, anomalias, corte de energia |
| `--blue-500` | `#3b82f6` | Gráficos secundários, comparativos |
| `--purple-500` | `#a855f7` | Gráficos terciários, relatórios |
| `--gray-100` | `#f3f4f6` | Skeleton loaders |
| `--gray-500` | `#6b7280` | Textos secundários, labels |
| `--gray-900` | `#111827` | Textos principais |

### 1.3 Tipografia

- **Font:** `Inter` (Google Fonts)
- `font-size-xs`: 12px — badges, labels de tabela
- `font-size-sm`: 14px — corpo de formulários
- `font-size-base`: 16px — texto padrão
- `font-size-lg`: 20px — títulos de seção
- `font-size-xl`: 28px — títulos de página
- `font-size-2xl`: 36px — KPIs do dashboard

---

## 2. Regras Globais de UX

### 2.1 Loading States

**Regra:** Nenhuma requisição pode deixar a tela "congelada". Use sempre:

- **Spinner** — para ações pontuais (submit de formulário, botão de ação)
- **Skeleton** — para carregamento de listas, tabelas e dashboards

### 2.2 Empty States

Quando uma lista retornar vazia, exibir tela amigável com ilustração SVG e CTA:

| Contexto | Mensagem | CTA |
|----------|----------|-----|
| Sem dispositivos | "Você ainda não possui dispositivos cadastrados." | "Adicionar Dispositivo" |
| Sem unidades | "Cadastre sua primeira unidade consumidora." | "Cadastrar Unidade" |
| Sem chamados | "Nenhum chamado aberto no momento." | — |
| Sem metas | "Proponha sua primeira meta de consumo." | "Nova Meta" |
| Sem alertas | "Tudo certo! Sem alertas ativos." | — |

### 2.3 Error Boundary

Cada seção de dashboard e lista de dados deve ser envolvida por um `ErrorBoundary`. O componente `ErrorCard` exibe mensagem de erro isolada sem "quebrar" o layout da página inteira.

### 2.4 Interceptor Axios — Redirecionamento 401

Configurar globalmente no Axios: se qualquer endpoint retornar `401 Unauthorized`, limpar o `localStorage`, resetar o estado global do usuário e redirecionar para `/login` automaticamente.

### 2.5 Regra de Role Isolation

> **Regra de Ouro:** O que o usuário não pode fazer **não aparece na tela**. Nem botões desabilitados, nem rotas acessíveis.

- Renderização condicional baseada no `role` armazenado no estado global.
- Rotas protegidas por `PrivateRoute` que verifica token e `role`.
- A sidebar é **completamente diferente** por role.

---

## 3. Catálogo de Endpoints por Role

### 3.1 🔓 Públicos (Sem autenticação)

| Método | Endpoint | Tela | Requisitos | Exceções |
|--------|----------|------|------------|----------|
| `POST` | `/auth/register` | Cadastro | `nome`, `email`, `senha` | 400: e-mail já cadastrado |
| `POST` | `/auth/login` | Login | `email`, `senha` | 400: credenciais inválidas / conta inativa |
| `POST` | `/auth/refresh` | — (automático) | `token`, `refreshToken` | 400: refresh expirado |

---

### 3.2 👤 Cliente

| Método | Endpoint | Funcionalidade | Exceções Relevantes |
|--------|----------|----------------|---------------------|
| `POST` | `/auth/logout` | Logout | 401: não autenticado |
| `GET` | `/usuarios/{id}` | Ver próprio perfil | 403: tentativa de ver outro |
| `PUT` | `/usuarios/{id}` | Editar perfil | 403: tentativa de editar outro |
| `GET` | `/unidades` | Listar minhas unidades | — |
| `POST` | `/unidades` | Cadastrar unidade | 400: CEP inválido / ViaCEP offline |
| `PUT` | `/unidades/{id}` | Editar unidade | 403: não é o dono |
| `GET` | `/unidades/cep/{cep}` | Consultar CEP (proxy) | 400: CEP inválido; 503: ViaCEP offline |
| `GET` | `/dispositivos` | Listar meus dispositivos | — |
| `POST` | `/dispositivos` | Cadastrar dispositivo | 403: unidade de outro cliente |
| `PUT` | `/dispositivos/{id}` | Editar dispositivo | 403: não é o dono |
| `GET` | `/dispositivos/{id}/anotacoes` | Ver anotações | 403: dispositivo de outro |
| `POST` | `/dispositivos/{id}/anotacoes` | Adicionar anotação | 403: dispositivo de outro |
| `PUT` | `/dispositivos/anotacoes/{id}` | Editar anotação | 403: anotação de outro |
| `DELETE` | `/dispositivos/anotacoes/{id}` | Excluir anotação | 403: anotação de outro |
| `POST` | `/chamados` | Abrir chamado | 400: dispositivo inválido |
| `GET` | `/chamados` | Ver meus chamados | — |
| `GET` | `/chamados/{id}` | Detalhe do chamado | 403: chamado de outro |
| `POST` | `/metas` | Propor meta | 400: dispositivo sem sensor |
| `PUT` | `/metas/{id}` | Editar meta | 403: meta de outro |
| `GET` | `/metas/{id}` | Ver meta | 403: meta de outro |
| `GET` | `/tarifas` | Histórico de tarifas | 401 |
| `GET` | `/tarifas/ativa` | Tarifa vigente | 404: nenhuma ativa |
| `GET` | `/categorias` | Listar categorias | 401 |
| `GET` | `/enderecos/cep/{cep}` | Proxy ViaCEP | 400: CEP inválido |
| `GET` | `/enderecos/ibge/{codigo}` | Dados IBGE do município | 400: código inválido |
| `GET` | `/enderecos/comparativo/cep/{cep}` | Comparativo por CEP | 400: sem unidades no CEP |
| `GET` | `/enderecos/comparativo/cidade/{cidade}` | Comparativo por Cidade | 400: sem unidades na cidade |
| `GET` | `/clima/{codigoIBGE}` | Clima local | 400: código inválido |

---

### 3.3 🔧 Operador

| Método | Endpoint | Funcionalidade | Exceções Relevantes |
|--------|----------|----------------|---------------------|
| `GET` | `/unidades` | Todas as unidades | — |
| `GET` | `/unidades/cliente/{clienteId}` | Unidades por cliente | — |
| `POST` | `/unidades` | Criar unidade para cliente (`?usuarioId=`) | — |
| `GET` | `/dispositivos` | Todos os dispositivos | — |
| `PUT` | `/dispositivos/{id}` | Editar dispositivo | — |
| `PATCH` | `/dispositivos/{id}/desativar` | Desativar dispositivo | 404 |
| `POST` | `/dispositivos/{id}/vincular-sensor/{sId}` | Vincular sensor | 400: sensor já em uso |
| `POST` | `/dispositivos/{id}/desvincular-sensor` | Desvincular sensor | 400: sem sensor |
| `POST` | `/dispositivos/{id}/limitar` | Limitar energia | 404 |
| `POST` | `/dispositivos/{id}/cortar` | Cortar energia | 404 |
| `POST` | `/dispositivos/{id}/restaurar` | Restaurar energia | 404 |
| `GET` | `/chamados` | Todos os chamados | — |
| `PATCH` | `/chamados/{id}/status` | Atualizar status | 400: transição inválida |
| `POST` | `/chamados/{id}/provisionar` | Provisionar sensor | 400: sensor indisponível |
| `GET` | `/metas` | Todas as metas | — |
| `PATCH` | `/metas/{id}/avaliar` | Aprovar/devolver meta | 404 |
| `GET` | `/sensores` | Listar sensores | — |
| `GET` | `/sensores/disponiveis` | Sensores disponíveis | — |
| `POST` | `/sensores` | Cadastrar sensor | 400: série duplicada |
| `PUT` | `/sensores/{id}` | Editar sensor | 404 |
| `PATCH` | `/sensores/{id}/status` | Alterar status | 404 |
| `DELETE` | `/sensores/{id}` | Desativar sensor | 404 |
| `POST` | `/categorias` | Criar categoria | 400: duplicada |
| `PUT` | `/categorias/{id}` | Editar categoria | 404 |
| `DELETE` | `/categorias/{id}` | Excluir categoria | 404 |
| `GET` | `/relatorios` | Listar relatórios | — |
| `POST` | `/relatorios` | Criar relatório | 400: chamado inválido |
| `GET` | `/ibge/municipio/{codigo}` | Dados IBGE | — |
| `GET` | `/clima/{codigoIBGE}` | Clima do município | — |

---

### 3.4 👑 Administrador (herda Operador, mais:)

| Método | Endpoint | Funcionalidade | Exceções Relevantes |
|--------|----------|----------------|---------------------|
| `GET` | `/usuarios` | Todos os usuários | — |
| `GET` | `/usuarios/clientes` | Listar clientes | — |
| `GET` | `/usuarios/operadores` | Listar operadores | — |
| `POST` | `/usuarios/operadores` | Criar operador | 400: e-mail duplicado |
| `PUT` | `/usuarios/operadores/{id}` | Editar operador | — |
| `PATCH` | `/usuarios/{id}/ativar` | Ativar usuário | — |
| `PATCH` | `/usuarios/{id}/desativar` | Desativar usuário | — |
| `DELETE` | `/unidades/{id}` | Desativar unidade | 404 |
| `POST` | `/tarifas` | Criar tarifa | 400: valor inválido |
| `PATCH` | `/tarifas/{id}/status` | Ativar/desativar tarifa | — |
| `GET` | `/configuracaoapi` | Listar configs de API | — |
| `POST` | `/configuracaoapi` | Criar config API | 400: nome duplicado |
| `PUT` | `/configuracaoapi/{id}` | Editar config API | — |
| `DELETE` | `/configuracaoapi/{id}` | Remover config API | — |
| `GET` | `/auditoria` | Logs de auditoria | — |
| `GET` | `/dashboard/admin` | Cockpit do ecossistema | — |

---

## 4. Matriz de Telas

### 4.1 Telas Públicas

| Rota | Tela | Endpoints | Comportamento Esperado |
|------|------|-----------|------------------------|
| `/login` | Login | `POST /auth/login` | Spinner no botão. Redireciona por role após login. |
| `/cadastro` | Cadastro | `POST /auth/register` | Feedback de erro inline nos campos. |

### 4.2 Cliente (`/cliente/...`)

| Rota | Tela | Endpoints | Comportamento Esperado |
|------|------|-----------|------------------------|
| `/cliente/dashboard` | Dashboard | `GET /dispositivos`, `GET /tarifas/ativa`, `GET /clima/{ibge}` | Cards com resumo. Skeleton no carregamento. Empty state se sem dispositivos. |
| `/cliente/perfil` | Meu Perfil | `GET /usuarios/{id}`, `PUT /usuarios/{id}` | Formulário editável. Modal de confirmação para senha. |
| `/cliente/unidades` | Minhas Unidades | `GET /unidades` | Lista com tipo, CEP, cidade. Empty state com CTA. |
| `/cliente/unidades/nova` | Cadastrar Unidade | `POST /unidades`, `GET /unidades/cep/{cep}` | CEP autocompleta endereço. Erro inline se inválido. |
| `/cliente/unidades/:id` | Detalhe da Unidade | `GET /unidades/{id}`, `GET /dispositivos/unidade/{id}` | Endereço completo + lista de dispositivos da unidade. |
| `/cliente/dispositivos` | Meus Dispositivos | `GET /dispositivos`, `GET /categorias` | Tabela com status badge. |
| `/cliente/dispositivos/novo` | Cadastrar Dispositivo | `POST /dispositivos`, `GET /categorias`, `GET /unidades` | Seleciona unidade e categoria. |
| `/cliente/dispositivos/:id` | Detalhe do Dispositivo | `GET /dispositivos/{id}`, `GET /dispositivos/{id}/anotacoes`, `GET /metas/dispositivo/{id}` | Consumo, anotações, meta. Error Boundary no gráfico. |
| `/cliente/chamados` | Meus Chamados | `GET /chamados` | Lista com badge de status. Botão "Novo Chamado". |
| `/cliente/chamados/novo` | Abrir Chamado | `POST /chamados`, `GET /dispositivos` | Tipo, dispositivo, descrição. |
| `/cliente/metas` | Minhas Metas | `GET /metas/{id}` | Status: Proposta / Aprovada / Devolvida. |
| `/cliente/metas/nova` | Propor Meta | `POST /metas`, `GET /dispositivos` | Seleciona dispositivo, tipo, valor. |
| `/cliente/comparativos` | Comparativos Regionais | `GET /enderecos/comparativo/cep/{cep}`, `GET /enderecos/comparativo/cidade/{cidade}`, `GET /clima/{ibge}` | Gráfico de barras + painel de clima. Error Boundary no gráfico. |
| `/cliente/tarifas` | Tarifas | `GET /tarifas/ativa`, `GET /tarifas` | Card da tarifa atual + histórico colapsável. |

### 4.3 Operador (`/operador/...`)

| Rota | Tela | Endpoints | Comportamento Esperado |
|------|------|-----------|------------------------|
| `/operador/dashboard` | Painel de Operações | `GET /chamados`, `GET /sensores/disponiveis`, `GET /metas` | Cards: chamados pendentes, sensores livres, metas para avaliar. |
| `/operador/chamados` | Fila de Chamados | `GET /chamados` | Filtros por status e tipo. Ação contextual por chamado. |
| `/operador/chamados/:id` | Detalhe do Chamado | `GET /chamados/{id}`, `PATCH /chamados/{id}/status`, `POST /chamados/{id}/provisionar` | Fluxo de status. Seletor de sensor se tipo=Instalação. |
| `/operador/dispositivos` | Todos Dispositivos | `GET /dispositivos` | Ações: Limitar / Cortar / Restaurar. Modal de confirmação para Cortar. |
| `/operador/dispositivos/:id` | Controle do Dispositivo | `GET /dispositivos/{id}`, controles de energia, vinculação de sensor | Painel de controle. |
| `/operador/sensores` | Estoque de Sensores | `GET /sensores` | Tabela com status. |
| `/operador/sensores/novo` | Cadastrar Sensor | `POST /sensores` | Formulário simples. |
| `/operador/metas` | Avaliar Metas | `GET /metas`, `PATCH /metas/{id}/avaliar` | Aprovar / Devolver com observação. |
| `/operador/relatorios` | Relatórios Técnicos | `GET /relatorios`, `POST /relatorios` | Listagem e criação por chamado. |
| `/operador/categorias` | Categorias | `GET/POST/PUT/DELETE /categorias` | CRUD inline. |
| `/operador/clientes` | Consultar Clientes | `GET /unidades/cliente/{id}`, `GET /usuarios/{id}` | Busca de cliente e suas unidades. |

### 4.4 Administrador (`/admin/...`)

| Rota | Tela | Endpoints | Comportamento Esperado |
|------|------|-----------|------------------------|
| `/admin/dashboard` | Cockpit do Ecossistema | `GET /dashboard/admin` | KPIs: kWh total, sensores ativos/inativos, status APIs, saúde Worker, chamados pendentes. |
| `/admin/usuarios` | Gestão de Usuários | `GET /usuarios`, `/clientes`, `/operadores` | Tabs por tipo. Ações: Ativar / Desativar. |
| `/admin/usuarios/operadores/novo` | Criar Operador | `POST /usuarios/operadores` | Formulário completo. |
| `/admin/tarifas` | Gestão de Tarifas | `GET /tarifas`, `POST /tarifas`, `PATCH /tarifas/{id}/status` | Histórico + formulário de nova bandeira. |
| `/admin/configuracoes/apis` | Config. APIs Externas | `GET/POST/PUT/DELETE /configuracaoapi` | Cards por API com status e edição de chave. |
| `/admin/auditoria` | Logs de Auditoria | `GET /auditoria` | Filtros: role, período, ação, entidade. |

---

## 5. Estrutura de Rotas e Navegação

### 5.1 Árvore de Rotas

```
/login
/cadastro

/cliente/
  dashboard · perfil · unidades · unidades/nova · unidades/:id
  dispositivos · dispositivos/novo · dispositivos/:id
  chamados · chamados/novo · metas · metas/nova
  comparativos · tarifas

/operador/
  dashboard · chamados · chamados/:id · dispositivos · dispositivos/:id
  sensores · sensores/novo · metas · relatorios · categorias · clientes

/admin/
  dashboard · usuarios · usuarios/operadores/novo
  tarifas · configuracoes/apis · auditoria
```

### 5.2 Sidebar por Role

**Cliente:** Dashboard · Unidades · Dispositivos · Chamados · Metas · Comparativos · Tarifas

**Operador:** Dashboard · Chamados · Dispositivos · Sensores · Metas · Relatórios · Categorias · Clientes

**Admin:** Dashboard · Usuários · Tarifas · Config. APIs · Auditoria

---

## 6. Componentes Globais Necessários

| Componente | Descrição |
|-----------|-----------|
| `PrivateRoute` | Verifica JWT e role antes de renderizar rota |
| `ErrorBoundary` | Isola erros de componentes filhos |
| `Spinner` | Indicador de loading pontual em botões/ações |
| `SkeletonRow` / `SkeletonCard` | Placeholder de carregamento de listas |
| `EmptyState` | Tela vazia com ilustração SVG e CTA |
| `StatusBadge` | Badge colorido para status de chamados/metas/sensores |
| `ConfirmModal` | Modal de confirmação para ações destrutivas |
| `Toast` | Feedback de sucesso/erro global |
| `DataTable` | Tabela paginada e ordenável reutilizável |
| `axiosInstance` | Instância Axios com interceptor 401 configurado |
