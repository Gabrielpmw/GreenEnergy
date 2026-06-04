# 📋 PRD — GreenEnergy: Gestão de Energia Sustentável

> **Versão:** 1.1 | **Data:** 2026-06-01 | **Status:** Em Revisão

---

## 1. Visão Geral do Produto

O **GreenEnergy** é uma plataforma web de monitoramento, análise e gestão de consumo de energia elétrica por unidades consumidoras. O sistema opera com três papéis distintos (Administrador, Operador e Cliente) e conta com um serviço autônomo em background (Worker Service) para telemetria IoT simulada, processamento de alertas e cache de APIs externas.

### 1.1 Objetivos de Negócio

| # | Objetivo |
|---|----------|
| 1 | Prover visibilidade em tempo real do consumo energético (kWh e R$) por dispositivo |
| 2 | Gerar projeções financeiras e comparativos regionais baseados em dados IBGE |
| 3 | Emitir alertas inteligentes cruzados com dados climáticos (OpenWeather) |
| 4 | Automatizar a telemetria de sensores IoT via Worker Service |
| 5 | Garantir governança e auditoria completa de ações no sistema |

---

## 2. Papéis e Responsabilidades

### 2.1 Administrador — Governança e Infraestrutura

- **Gestão de Operadores:** cadastrar e editar Operadores; **sem exclusão** — apenas desativação por soft delete
- **Gestão de Clientes (visualização):** listar todos os usuários comuns e ativar/desativar suas contas
- **Regra de Role Imutável:** roles são permanentes; um Operador que queira ser Cliente deve se registrar como novo usuário
- **Configuração de APIs e Tarifas:** gerencia chaves de acesso (OpenWeather, IBGE) e bandeiras/tarifas (dispara recálculo financeiro geral)
- **Painel de Auditoria (Logs):** filtros por `[Tipo de Usuário]` e `[Período de Tempo]`
- **Cockpit de Saúde do Ecossistema:** volume total de energia na rede, status das APIs externas, saúde do Worker Service, sensores ativos/inativos e fila de chamados pendentes

### 2.2 Cliente — Gestor da Unidade Consumidora

- **Autocadastro (Onboarding):** registro autônomo na Home pública; atualiza apenas o próprio perfil
- **Gestão da Unidade Consumidora:** cadastro de endereço com validação via ViaCEP + IBGE; tipologia (Casa, Apartamento, Comercial)
- **Cadastro de Dispositivos:** informa nome, categoria, tipo de aparelho (campo livre) e potência; pode adicionar **anotações** textuais ao dispositivo a qualquer momento
- **Remoção de Dispositivo via Chamado:** para remover um dispositivo, o cliente abre um chamado do tipo `Remocao`; o Operador retira o sensor fisicamente e conclui o chamado — somente então o dispositivo é desativado (soft delete)
- **Solicitação de Perícia:** abertura de chamado técnico tipo `Instalacao`; esteira `Pendente → Em Análise → Validado`
- **Gerenciamento de Metas:** proposta de limites (kWh ou R$) por dispositivo com justificativa
- **Monitoramento em Tempo Real:** consumo por aparelho, projeção financeira mensal
- **Comparativos de Eficiência:** por **CEP** ou por **Cidade** (cruzamento via IBGE)
- **Alertas Inteligentes:** notificações cruzadas com clima (ex.: pico de temperatura × uso de ar-condicionado)

### 2.3 Operador — Consultor e Técnico de Operações

- **CRUD de Hardware e Categorias:** cadastro de modelos de sensores e categorias de aparelhos eletrônicos
- **Gestão de Chamados:** triagem e análise das solicitações de monitoramento
- **Finalização de Perícia e Provisionamento:** associação Dispositivo ↔ Sensor físico; validação de telemetria inicial
- **Diagnóstico e Análise de Metas:** aprovação/devolução de metas com ressalvas; geração de Relatórios Técnicos Formais
- **Controle Remoto:** limitação ou corte de energia de dispositivo específico
- **Gestão de Saúde do Ativo:** suspensão temporária de sensor com defeito

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|--------|-----------|------------|
| **Backend API** | .NET 8 (ASP.NET Core) | REST API com arquitetura MVC |
| **Background** | .NET Worker Service | Telemetria IoT, alertas, cache de APIs |
| **Documentação API** | Swagger / Swashbuckle | Contrato de endpoints auto-documentado |
| **Frontend** | React + Vite (TypeScript) | SPA desacoplada |
| **Visualização** | Recharts | Gráficos de consumo, projeções, comparativos |
| **Banco de Dados** | SQL Server (LocalDB dev) | Persistência relacional |
| **APIs Externas** | ViaCEP, IBGE, OpenWeather | Endereço, dados regionais, clima |

**Connection String (desenvolvimento):**
```
Server=(localdb)\MSSQLLocalDB;Database=GreenEnergyDB;Trusted_Connection=True;TrustServerCertificate=True;
```

---

## 4. Arquitetura do Sistema

### 4.1 Padrão MVC + API Desacoplada

```
┌─────────────────────────────────────────────┐
│              React + Vite (SPA)             │
│    Recharts │ React Router │ Axios/Fetch     │
└──────────────────┬──────────────────────────┘
                   │ HTTP/JSON (CORS)
┌──────────────────▼──────────────────────────┐
│         ASP.NET Core Web API (.NET 8)        │
│  Controllers → Services → Repositories      │
│  Swagger UI │ JWT Auth │ AutoMapper          │
└──────┬─────────────────────────┬────────────┘
       │                         │
┌──────▼──────┐         ┌────────▼────────────┐
│  SQL Server │         │   Worker Service    │
│  (EF Core)  │◄────────│  Telemetria │ Cache │
└─────────────┘         └─────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
         ┌────▼────┐       ┌─────▼─────┐      ┌─────▼─────┐
         │ ViaCEP  │       │   IBGE    │      │OpenWeather│
         └─────────┘       └───────────┘      └───────────┘
```

### 4.2 Camadas da API (.NET MVC)

| Camada | Pasta | Responsabilidade |
|--------|-------|-----------------|
| **Controllers** | `/Controllers` | Recebe requests HTTP, retorna responses |
| **Services** | `/Services` | Lógica de negócio e orquestração |
| **Repositories** | `/Repositories` | Acesso a dados via EF Core |
| **Models** | `/Models/Entities` | Entidades do domínio |
| **DTOs** | `/Models/DTOs` | Contratos de entrada/saída da API |
| **Workers** | `/Workers` | Background Services |
| **Integrations** | `/Integrations` | Clientes HTTP para APIs externas |

---

## 5. Modelo de Dados — Entidades

### 5.1 Diagrama de Entidades (18 tabelas)

> **Soft Delete global:** todas as entidades possuem `IsDeleted (bit)` e `IsActive (bit)`. Nunca há exclusão física — apenas desativação/reativação.

```
Usuario (1) ──────── (1) Perfil
Usuario (1) ──────── (N) AuditLog
Usuario (1) ──────── (N) Alerta

UnidadeConsumidora (N) ──── (1) Usuario [Cliente]
UnidadeConsumidora (1) ──── (N) Dispositivo
UnidadeConsumidora (1) ──── (1) Endereco

Dispositivo (1) ──── (1) Sensor
Dispositivo (1) ──── (N) Telemetria
Dispositivo (1) ──── (N) Meta
Dispositivo (1) ──── (N) AnotacaoDispositivo  ← 18ª entidade
Dispositivo (N) ──── (1) CategoriaAparelho

Chamado (N) ──── (1) Usuario [Cliente]
Chamado (N) ──── (1) Usuario [Operador]
Chamado (1) ──── (1) Dispositivo
Chamado.Tipo: Instalacao | Remocao | Manutencao

Meta (N) ──── (1) Usuario [Operador] (avaliador)

Tarifa (standalone)
ConfiguracaoAPI (standalone)
CacheClima (standalone)
RelatorioTecnico (N) ──── (1) Chamado
```

### 5.2 Descrição das Entidades

| # | Entidade | Campos Principais |
|---|----------|-------------------|
| 1 | **Usuario** | Id, Nome, Email, SenhaHash, Role (Admin/Operador/Cliente — **imutável**), IsActive, IsDeleted, CriadoEm |
| 2 | **Perfil** | Id, UsuarioId (1:1), Telefone, Documento, AvatarUrl, IsDeleted |
| 3 | **UnidadeConsumidora** | Id, UsuarioId, TipoImovel, CEP, CodigoIBGE, Cidade, Estado, IsActive, IsDeleted |
| 4 | **Endereco** | Id, UnidadeId, CEP, Logradouro, Numero, Complemento, Bairro, Cidade, UF, IsDeleted |
| 5 | **Dispositivo** | Id, UnidadeId, CategoriaId, Nome, TipoAparelho, Descricao, PotenciaWatts, Status, IsActive, IsDeleted, CriadoEm |
| 6 | **CategoriaAparelho** | Id, Nome, Descricao, IconeUrl, IsDeleted |
| 7 | **Sensor** | Id, DispositivoId, ModeloSensor, NumeroSerie, Status (Ativo/Suspenso/Defeito), UltimoSinal, IsDeleted |
| 8 | **Telemetria** | Id, SensorId, ConsumoKWh, TensaoV, CorrenteA, RegistradoEm |
| 9 | **AnotacaoDispositivo** | Id, DispositivoId, ClienteId, Conteudo, CriadoEm, IsDeleted |
| 10 | **Meta** | Id, DispositivoId, OperadorId, TipoMeta (kWh/R$), ValorLimite, Justificativa, Status, AvaliacaoObs, IsDeleted |
| 11 | **Chamado** | Id, ClienteId, OperadorId, DispositivoId, Tipo (Instalacao/Remocao/Manutencao), Status (Pendente/EmAnalise/Validado), Descricao, CriadoEm, IsDeleted |
| 12 | **Alerta** | Id, UsuarioId, DispositivoId, Mensagem, Tipo, Lido, GeradoEm, IsDeleted |
| 13 | **RelatorioTecnico** | Id, ChamadoId, OperadorId, Conteudo, TipoOcorrencia, CriadoEm, IsDeleted |
| 14 | **AuditLog** | Id, UsuarioId, Acao, Entidade, EntidadeId, DadosAnteriores, DadosNovos, IP, Timestamp |
| 15 | **Tarifa** | Id, Bandeira (Verde/Amarela/Vermelha1/Vermelha2), ValorKWh, VigenciaInicio, IsDeleted |
| 16 | **ConfiguracaoAPI** | Id, NomeAPI, ChaveAcesso, BaseUrl, AtualizadoEm, IsDeleted |
| 17 | **CacheClima** | Id, CodigoIBGE, Cidade, TempMin, TempMax, Descricao, UmidadePercent, AtualizadoEm |
| 18 | **CacheDadosIBGE** | Id, CodigoIBGE, NomeMunicipio, UF, PopulacaoEstimada, AtualizadoEm |

---

## 6. Catálogo de Endpoints REST (Swagger)

> Prefixo base: `/api/v1`

### 6.1 Autenticação

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| POST | `/auth/register` | Autocadastro do Cliente | Público |
| POST | `/auth/login` | Autenticação JWT | Público |
| POST | `/auth/refresh` | Renovar token JWT | Autenticado |
| POST | `/auth/logout` | Invalidar token | Autenticado |

### 6.2 Usuários e Perfis

> **Regras de negócio:**
> - Role é **imutável** após o cadastro
> - Cliente atualiza **apenas o próprio** perfil
> - Operador é atualizado **somente pelo Admin**
> - **Não há DELETE** de usuário/operador — apenas soft delete via status

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/usuarios` | Listar todos os usuários | Admin |
| GET | `/usuarios/clientes` | Listar apenas Clientes | Admin |
| GET | `/usuarios/operadores` | Listar apenas Operadores | Admin |
| GET | `/usuarios/{id}` | Buscar usuário por ID | Admin, próprio |
| POST | `/usuarios/operadores` | Criar Operador | Admin |
| PUT | `/usuarios/{id}` | Atualizar dados próprios | Cliente (próprio) |
| PUT | `/usuarios/operadores/{id}` | Atualizar Operador | Admin |
| PATCH | `/usuarios/{id}/ativar` | Reativar usuário (soft delete) | Admin |
| PATCH | `/usuarios/{id}/desativar` | Desativar usuário (soft delete) | Admin |
| GET | `/usuarios/{id}/perfil` | Buscar perfil | Admin, próprio |
| PUT | `/usuarios/{id}/perfil` | Atualizar perfil | próprio |

### 6.3 Unidades Consumidoras

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/unidades` | Listar unidades | Admin, Operador |
| GET | `/unidades/{id}` | Buscar unidade | Admin, Operador, dono |
| POST | `/unidades` | Criar unidade | Cliente |
| PUT | `/unidades/{id}` | Atualizar unidade | Cliente (dono) |
| PATCH | `/unidades/{id}/desativar` | Desativar unidade | Admin |
| GET | `/unidades/cliente/{clienteId}` | Unidades de um cliente | Admin, Operador, próprio |

### 6.4 Endereços (ViaCEP + IBGE)

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/enderecos/cep/{cep}` | Consulta ViaCEP (proxy) | Autenticado |
| GET | `/enderecos/ibge/{codigoIBGE}` | Consulta cache IBGE | Autenticado |
| GET | `/enderecos/comparativo/cep/{cep}` | Comparativo de eficiência por CEP | Cliente |
| GET | `/enderecos/comparativo/cidade/{cidade}` | Comparativo de eficiência por Cidade | Cliente |

### 6.5 Dispositivos

> **Remoção:** cliente abre chamado do tipo `Remocao`. O Operador retira o sensor e conclui o chamado. Só então o dispositivo é desativado via soft delete.

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/dispositivos` | Listar todos | Admin, Operador |
| GET | `/dispositivos/{id}` | Buscar por ID | Admin, Operador, dono |
| GET | `/dispositivos/unidade/{unidadeId}` | Por unidade | Admin, Operador, dono |
| POST | `/dispositivos` | Criar dispositivo | Cliente |
| PUT | `/dispositivos/{id}` | Atualizar | Cliente (dono) |
| PATCH | `/dispositivos/{id}/desativar` | Desativar após remoção | Operador |

### 6.5.1 Anotações de Dispositivo

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/dispositivos/{id}/anotacoes` | Listar anotações | Admin, Operador, dono |
| POST | `/dispositivos/{id}/anotacoes` | Adicionar anotação | Cliente (dono) |
| PUT | `/anotacoes/{id}` | Editar anotação | Cliente (dono) |
| PATCH | `/anotacoes/{id}/desativar` | Desativar anotação | Cliente (dono) |

### 6.6 Categorias de Aparelhos

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/categorias` | Listar categorias | Autenticado |
| GET | `/categorias/{id}` | Buscar categoria | Autenticado |
| POST | `/categorias` | Criar categoria | Operador |
| PUT | `/categorias/{id}` | Atualizar | Operador |
| DELETE | `/categorias/{id}` | Remover | Operador |

### 6.7 Sensores

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/sensores` | Listar sensores | Admin, Operador |
| GET | `/sensores/{id}` | Buscar sensor | Admin, Operador |
| POST | `/sensores` | Cadastrar sensor | Operador |
| PUT | `/sensores/{id}` | Atualizar sensor | Operador |
| PATCH | `/sensores/{id}/status` | Suspender/Ativar sensor | Operador |

### 6.8 Telemetria

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/telemetria/dispositivo/{id}` | Histórico de consumo | Admin, Operador, dono |
| GET | `/telemetria/dispositivo/{id}/realtime` | Último registro | Admin, Operador, dono |
| GET | `/telemetria/unidade/{id}/resumo` | Resumo da unidade | Admin, Operador, dono |
| GET | `/telemetria/projecao/{unidadeId}` | Projeção financeira mensal | Cliente (dono) |

### 6.9 Metas

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/metas` | Listar todas | Admin, Operador |
| GET | `/metas/{id}` | Buscar meta | Admin, Operador, dono |
| GET | `/metas/dispositivo/{id}` | Metas por dispositivo | Autenticado |
| POST | `/metas` | Propor meta | Cliente |
| PUT | `/metas/{id}` | Atualizar proposta | Cliente (dono) |
| PATCH | `/metas/{id}/avaliar` | Aprovar/Devolver meta | Operador |

### 6.10 Chamados (Perícias)

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/chamados` | Listar chamados | Admin, Operador |
| GET | `/chamados/{id}` | Buscar chamado | Admin, Operador, dono |
| GET | `/chamados/cliente/{id}` | Chamados do cliente | Admin, Operador, próprio |
| POST | `/chamados` | Abrir chamado | Cliente |
| PATCH | `/chamados/{id}/status` | Atualizar status | Operador |
| POST | `/chamados/{id}/provisionar` | Finalizar perícia | Operador |

### 6.11 Alertas

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/alertas/usuario/{id}` | Alertas do usuário | próprio, Admin |
| PATCH | `/alertas/{id}/lido` | Marcar como lido | próprio |
| DELETE | `/alertas/{id}` | Remover alerta | próprio, Admin |

### 6.12 Relatórios Técnicos

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/relatorios` | Listar relatórios | Admin, Operador |
| GET | `/relatorios/{id}` | Buscar relatório | Admin, Operador |
| POST | `/relatorios` | Criar relatório | Operador |
| GET | `/relatorios/chamado/{id}` | Relatórios de um chamado | Admin, Operador |

### 6.13 Tarifas

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/tarifas/vigente` | Tarifa atual | Autenticado |
| GET | `/tarifas` | Histórico de tarifas | Admin |
| POST | `/tarifas` | Cadastrar nova tarifa | Admin |

### 6.14 Auditoria

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/auditoria` | Listar logs | Admin |
| GET | `/auditoria/filtrar` | Filtrar por tipo/período | Admin |

### 6.15 Dashboard / Cockpit

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/dashboard/admin` | Indicadores do ecossistema | Admin |
| GET | `/dashboard/cliente/{id}` | Painel do cliente | Cliente |
| GET | `/dashboard/operador` | Fila de chamados e metas | Operador |

### 6.16 Clima e Dados Externos (Cache Interno)

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| GET | `/clima/{codigoIBGE}` | Dados climáticos em cache | Autenticado |
| GET | `/ibge/municipio/{codigo}` | Dados municipais em cache | Autenticado |

### 6.17 Controle Remoto

| Método | Rota | Descrição | Roles |
|--------|------|-----------|-------|
| POST | `/dispositivos/{id}/limitar` | Limitar fornecimento | Operador |
| POST | `/dispositivos/{id}/cortar` | Cortar fornecimento | Operador |
| POST | `/dispositivos/{id}/restaurar` | Restaurar fornecimento | Operador |

---

## 7. Worker Service — Fluxos Autônomos

### 7.1 Telemetria IoT Simulada
- **Ciclo:** a cada 30 segundos
- **Lógica:** percorre `Sensores` com `Status = Ativo`; gera valores de consumo coerentes (baseados em `PotenciaWatts` ± variação aleatória controlada); persiste em `Telemetria`

### 7.2 Processamento de Alertas
- **Trigger:** após cada inserção de telemetria
- **Lógica:** verifica se o valor acumulado do período ultrapassa a `Meta` ativa do dispositivo; se sim, insere registro em `Alerta`

### 7.3 Cache de APIs Externas
| API | Intervalo | Entidade Cache |
|-----|-----------|---------------|
| OpenWeather | 1 hora | `CacheClima` |
| IBGE | 24 horas | `CacheDadosIBGE` |

---

## 8. Integrações com APIs Externas

### 8.1 ViaCEP
- **Endpoint:** `https://viacep.com.br/ws/{cep}/json/`
- **Uso:** validação e autopreenchimento de endereço no cadastro de unidade consumidora
- **Chamado por:** API principal (síncrono, no request do usuário)

### 8.2 IBGE
- **Endpoint:** `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{codigo}`
- **Uso:** dados demográficos para comparativos regionais de eficiência
- **Chamado por:** Worker Service (cache) + API principal (lê cache)

### 8.3 OpenWeather
- **Endpoint:** `https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}`
- **Uso:** dados climáticos para alertas inteligentes
- **Chamado por:** Worker Service (cache) + API principal (lê cache)
- **Chave gerenciada por:** Administrador via `ConfiguracaoAPI`

---

## 9. Frontend — React + Vite

### 9.1 Estrutura de Módulos

```
src/
├── assets/
├── components/
│   ├── ui/          (botões, inputs, cards, badges)
│   ├── charts/      (Recharts wrappers)
│   └── layout/      (Navbar, Sidebar, Footer)
├── pages/
│   ├── auth/        (Login, Register)
│   ├── admin/       (Dashboard, Operadores, Auditoria, Tarifas)
│   ├── cliente/     (Dashboard, Unidade, Dispositivos, Metas, Chamados, Alertas)
│   └── operador/    (Dashboard, Chamados, Sensores, Categorias, Relatórios)
├── hooks/           (useAuth, useTelemetria, useAlerts)
├── services/        (api.ts, auth.service.ts, etc.)
├── store/           (Zustand ou Context API)
└── types/           (interfaces TypeScript)
```

### 9.2 Gráficos com Recharts

| Gráfico | Dados | Página |
|---------|-------|--------|
| `LineChart` | Consumo kWh ao longo do tempo | Dashboard Cliente |
| `AreaChart` | Projeção financeira mensal | Dashboard Cliente |
| `BarChart` | Consumo por dispositivo | Dashboard Cliente |
| `PieChart` | Distribuição por categoria | Dashboard Admin |
| `RadarChart` | Comparativo regional de eficiência | Dashboard Cliente |
| `LineChart` | Volume de telemetria na rede | Dashboard Admin (Cockpit) |

---

## 10. Segurança e Autenticação

- **JWT Bearer Tokens** com claims de `Role`, `UserId`, `Email`
- **Refresh Token** persistido em cookie HttpOnly
- **Autorização por Role:** `[Authorize(Roles = "Admin,Operador")]` nos controllers
- **Auditoria automática:** middleware que intercepta mutações (POST/PUT/PATCH/DELETE) e grava em `AuditLog`
- **CORS:** configurado para aceitar apenas a origin do frontend React

---

## 11. SKILL tlc-spec-driven — Diretrizes

A arquitetura segue a SKILL **tlc-spec-driven**, garantindo que:

1. **Contrato primeiro:** todo endpoint deve ter seu DTO de request/response definido antes da implementação
2. **Swagger como fonte de verdade:** a documentação Swagger/OpenAPI deve ser gerada automaticamente e estar sempre atualizada com anotações XML nos controllers
3. **DTOs explícitos:** nenhuma entidade de domínio é exposta diretamente; sempre use `RequestDTO` / `ResponseDTO`
4. **Validações declarativas:** use `DataAnnotations` ou `FluentValidation` para todas as entradas
5. **Respostas padronizadas:** todos os endpoints retornam um envelope `ApiResponse<T>`:

```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public IEnumerable<string>? Errors { get; set; }
}
```

6. **Versionamento de API:** prefixo `/api/v1/` obrigatório
7. **Tratamento global de erros:** `ExceptionHandlerMiddleware` centralizado
8. **Testes de contrato:** todo novo endpoint deve ter ao menos um teste de integração validando o schema de resposta

---

## 12. Critérios de Aceite por Módulo

| Módulo | Critério de Aceite |
|--------|-------------------|
| Autenticação | JWT gerado em login; refresh funcional; roles validadas nos endpoints |
| Cadastro de Cliente | ViaCEP preenche endereço automaticamente; CEP inválido retorna erro claro |
| Telemetria | Worker insere registros a cada 30s; gráfico atualiza sem refresh manual |
| Alertas | Alerta gerado em até 60s após ultrapassar meta; notificação exibida no frontend |
| Auditoria | Toda ação de Admin/Operador registrada com usuário, IP e timestamp |
| Cache APIs | OpenWeather atualizado a cada 1h; IBGE a cada 24h; frontend lê cache local |
| Cockpit Admin | Status do Worker visível em tempo real; contagem de sensores ativos correta |
| Controle Remoto | Limitação/corte refletido imediatamente no status do dispositivo no banco |

---

## 13. Estrutura de Pastas — Solução .NET

```
GreenEnergy.sln
├── GreenEnergy.API/             ← ASP.NET Core Web API
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   │   ├── Entities/
│   │   └── DTOs/
│   ├── Integrations/
│   │   ├── ViaCepClient.cs
│   │   ├── IbgeClient.cs
│   │   └── OpenWeatherClient.cs
│   ├── Middleware/
│   ├── Data/                    ← DbContext + Migrations
│   └── Program.cs
├── GreenEnergy.Worker/          ← .NET Worker Service
│   ├── Workers/
│   │   ├── TelemetriaWorker.cs
│   │   ├── AlertaWorker.cs
│   │   └── CacheApiWorker.cs
│   └── Program.cs
├── GreenEnergy.Tests/           ← xUnit Tests
└── GreenEnergy.Frontend/        ← React + Vite (TypeScript)
```

---

## 14. Roadmap de Construção — Etapas

### Fase 1 — Fundação do Backend
- [x] Criar solução `.sln` com projetos `API`, `Worker`, `Tests`
- [x] Configurar EF Core + SQL Server + connection string LocalDB
- [x] Criar todas as 18 entidades com campos `IsDeleted`/`IsActive`
- [x] Gerar migrations e seed inicial (Admin padrão, categorias, tarifas)
- [x] Configurar Swagger/Swashbuckle com XML comments + envelope `ApiResponse<T>`
- [x] Configurar JWT Auth + middleware de auditoria + CORS

### Fase 2 — Módulo de Autenticação e Usuários
- [x] Endpoints `/auth` (register, login, refresh, logout)
- [x] Endpoints `/usuarios` com regras de role imutável e soft delete
- [x] Validação de role no token; proteção de rotas por `[Authorize(Roles)]`

### Fase 3 — Módulo de Unidade e Dispositivos
- [ ] Endpoints `/unidades` com integração ViaCEP no cadastro
- [ ] Endpoints `/dispositivos` + `/anotacoes`
- [ ] Fluxo de chamado tipo `Remocao` para desativação de dispositivo
- [ ] Endpoints `/categorias`

### Fase 4 — Worker Service
- [ ] `TelemetriaWorker` — ciclo de 30s, geração simulada por `PotenciaWatts`
- [ ] `AlertaWorker` — verificação pós-telemetria contra metas ativas
- [ ] `CacheApiWorker` — OpenWeather (1h) e IBGE (24h)

### Fase 5 — Módulo Operacional
- [ ] Endpoints `/chamados` (triagem, provisionamento, remoção)
- [ ] Endpoints `/metas` (proposta + avaliação do Operador)
- [ ] Endpoints `/sensores` + controle de saúde do ativo
- [ ] Endpoints `/relatorios` técnicos
- [ ] Endpoints de controle remoto (`/limitar`, `/cortar`, `/restaurar`)

### Fase 6 — Módulo de Gestão (Admin)
- [ ] Endpoints `/tarifas`, `/configuracaoapi`, `/auditoria`
- [ ] Endpoints `/dashboard/admin` (Cockpit de saúde do ecossistema)
- [ ] Listagem e ativação/desativação de Clientes e Operadores

### Fase 7 — Integração IBGE + Comparativos
- [ ] Cache `CacheDadosIBGE` populado pelo Worker
- [ ] Endpoints `/enderecos/comparativo/cep` e `/cidade`
- [ ] Lógica de comparativo por tipo de imóvel × região

### Fase 8 — Frontend: Fundação e Infraestrutura
> Referência completa: `FRONTEND_CONTEXT.md`

- [ ] **8.1** Scaffold do projeto: `npm create vite@latest greenenergy-frontend -- --template react-ts`
- [ ] **8.2** Instalar dependências: `react-router-dom`, `axios`, `recharts`, `zustand` (ou Context API), `lucide-react` (ícones)
- [ ] **8.3** Configurar proxy de desenvolvimento no `vite.config.ts` apontando para `http://localhost:5288`
- [ ] **8.4** Criar `axiosInstance.ts` com interceptor 401 → redireciona para `/login` e limpa estado
- [ ] **8.5** Criar Design System em `src/styles/tokens.css` com todas as variáveis de cor (verde, suporte, gray)
- [ ] **8.6** Importar fonte `Inter` do Google Fonts no `index.html`
- [ ] **8.7** Implementar componentes globais: `Spinner`, `SkeletonRow`, `SkeletonCard`, `EmptyState`, `StatusBadge`, `ConfirmModal`, `Toast`, `ErrorBoundary`, `ErrorCard`
- [ ] **8.8** Implementar `PrivateRoute` com verificação de token JWT e role via estado global
- [ ] **8.9** Criar layout base com `Sidebar` + `Header` + `ContentArea` — sidebar muda completamente por role
- [ ] **8.10** Configurar `React Router` com todas as rotas públicas, de cliente, operador e admin

### Fase 9 — Frontend: Telas Públicas e Autenticação

- [ ] **9.1** Tela `/login` — formulário email/senha, Spinner no botão, redirecionamento por role após login
- [ ] **9.2** Tela `/cadastro` — formulário de auto-cadastro de cliente, validação inline, feedback de erro
- [ ] **9.3** Armazenar `token`, `refreshToken`, `userId`, `role` e `nome` no estado global após login
- [ ] **9.4** Implementar fluxo de `refresh token` automático ao receber 401 (antes de redirecionar)
- [ ] **9.5** Botão de Logout no Header → `POST /auth/logout` → limpar estado → redirecionar para `/login`

### Fase 10 — Frontend: Telas do Cliente (Parte 1 — Dados Básicos)

- [ ] **10.1** `/cliente/dashboard` — Cards de resumo: total de dispositivos, tarifa vigente, clima local. Skeleton no carregamento. Empty state se sem dispositivos (ilustração + CTA "Adicionar Dispositivo")
- [ ] **10.2** `/cliente/perfil` — Ver e editar nome, email, telefone. Modal de confirmação para troca de senha
- [ ] **10.3** `/cliente/unidades` — Lista de unidades com tipo de imóvel, CEP, cidade. Botão "Nova Unidade". Empty state amigável
- [ ] **10.4** `/cliente/unidades/nova` — Formulário: CEP com autopreenchimento via `GET /unidades/cep/{cep}`, tipo de imóvel. Feedback de erro se CEP inválido ou ViaCEP offline
- [ ] **10.5** `/cliente/unidades/:id` — Exibe endereço completo + lista de dispositivos da unidade selecionada

### Fase 11 — Frontend: Telas do Cliente (Parte 2 — Dispositivos e Consumo)

- [ ] **11.1** `/cliente/dispositivos` — Tabela com nome, tipo, potência, status (badge colorido). Skeleton durante carregamento
- [ ] **11.2** `/cliente/dispositivos/novo` — Seleciona unidade, categoria, informa nome e potência em watts
- [ ] **11.3** `/cliente/dispositivos/:id` — Detalhe: gráfico de consumo (AreaChart Recharts) dentro de `ErrorBoundary`. Lista de anotações. Meta proposta (se houver)
- [ ] **11.4** Anotações: adicionar, editar e excluir anotações inline no detalhe do dispositivo
- [ ] **11.5** `/cliente/tarifas` — Card em destaque com tarifa vigente (bandeira colorida). Histórico em tabela colapsável

### Fase 12 — Frontend: Telas do Cliente (Parte 3 — Chamados, Metas e Comparativos)

- [ ] **12.1** `/cliente/chamados` — Lista com status colorido (Pendente=amber, EmAtendimento=blue, Finalizado=green). Botão "Novo Chamado"
- [ ] **12.2** `/cliente/chamados/novo` — Seleciona tipo (Instalação/Remoção), dispositivo, escreve descrição
- [ ] **12.3** `/cliente/metas` — Lista de metas por dispositivo com status (Proposta/Aprovada/Devolvida). Badge de status
- [ ] **12.4** `/cliente/metas/nova` — Seleciona dispositivo, tipo de meta (kWh ou R$), valor limite, justificativa
- [ ] **12.5** `/cliente/comparativos` — BarChart comparando consumo do cliente vs. média regional (por CEP ou cidade). Painel de clima ao lado com dados de temperatura e umidade. Error Boundary em ambos os gráficos

### Fase 13 — Frontend: Telas do Operador

- [ ] **13.1** `/operador/dashboard` — Cards: chamados pendentes, sensores disponíveis no estoque, metas aguardando avaliação
- [ ] **13.2** `/operador/chamados` — Tabela com filtros por status e tipo. Ação contextual por linha
- [ ] **13.3** `/operador/chamados/:id` — Fluxo de status com botões de transição. Se tipo=Instalação: dropdown de sensores disponíveis para provisionar. ConfirmModal antes de provisionar
- [ ] **13.4** `/operador/dispositivos` — Todos os dispositivos do sistema. Ações: Limitar / Cortar (com ConfirmModal) / Restaurar energia
- [ ] **13.5** `/operador/dispositivos/:id` — Painel de controle: botões de ação de energia, vincular/desvincular sensor, ver histórico de telemetria (LineChart)
- [ ] **13.6** `/operador/sensores` — Estoque de sensores com status. Botão "Cadastrar Sensor"
- [ ] **13.7** `/operador/metas` — Metas com status "Proposta". Formulário inline: Aprovar ou Devolver com campo de observação
- [ ] **13.8** `/operador/relatorios` — Listagem e criação de relatório técnico vinculado a um chamado
- [ ] **13.9** `/operador/categorias` — CRUD inline: criar, editar e excluir categorias de aparelhos
- [ ] **13.10** `/operador/clientes` — Busca de cliente para visualizar suas unidades consumidoras

### Fase 14 — Frontend: Telas do Administrador

- [ ] **14.1** `/admin/dashboard` — Cockpit: KPIs em cards grandes (volume kWh, sensores ativos/inativos, status APIs externas com ícone verde/vermelho, saúde do Worker Service, chamados pendentes). Todos com Skeleton
- [ ] **14.2** `/admin/usuarios` — Tabs: Todos / Clientes / Operadores. Ações: Ativar / Desativar (ConfirmModal). Badge de status na linha
- [ ] **14.3** `/admin/usuarios/operadores/novo` — Formulário completo: nome, email, senha, documento, telefone
- [ ] **14.4** `/admin/tarifas` — Card da tarifa ativa em destaque. Tabela do histórico. Formulário de nova bandeira tarifária com valor (R$/kWh) e início de vigência
- [ ] **14.5** `/admin/configuracoes/apis` — Cards por API (OpenWeather, IBGE, ViaCEP) com status e campo para editar a chave de acesso
- [ ] **14.6** `/admin/auditoria` — Tabela filtrada por role, período (date range picker), ação e entidade. Exportação opcional como CSV

### Fase 15 — Testes e Documentação Final

- [ ] **15.1** Testes de contrato para todos os endpoints backend (xUnit + WebApplicationFactory)
- [ ] **15.2** Revisão final do Swagger (exemplos, descrições, tags por controller)
- [ ] **15.3** Validação dos critérios de aceite da Seção 12
- [ ] **15.4** Testes de navegação por role: confirmar que nenhuma rota de outra role é acessível
- [ ] **15.5** Testar todos os empty states, error boundaries e estados de loading

---

*Documento gerado com base em `green.md` — v1.1 atualizado em 2026-06-01.*
