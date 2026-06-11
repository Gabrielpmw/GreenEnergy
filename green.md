# 🌿 GreenEnergy: Gestão de Energia Sustentável

O **GreenEnergy** é uma plataforma inteligente para o monitoramento, análise e gestão de consumo de energia elétrica por unidades consumidoras. O sistema é operado sob três papéis distintos e conta com um serviço autônomo (Worker) para garantir eficiência, segurança e governança na gestão dos dados de telemetria.

---

## 👑 1. Administrador (Governança e Infraestrutura)
O Administrador atua nos bastidores. Ele não interage com o cliente final nem com o hardware, mas garante que o ecossistema do software, suas integrações e a equipe técnica funcionem perfeitamente.

* **Gestão de Pessoal (CRUD de Operadores):** Único papel com privilégio para cadastrar, editar, suspender e remover as contas dos Operadores técnicos e usuários comuns.
* **Configuração de APIs e Tarifas:** Responsável por cadastrar e atualizar as chaves de acesso de integrações externas (OpenWeather e IBGE). Também altera manualmente as bandeiras e os valores das tarifas de energia, o que engatilha o recálculo financeiro para toda a rede.
* **Monitoria de Auditoria (Logs):** Acesso a um painel de segurança para rastrear ações no sistema. Utiliza filtros de `[Tipo de usuário]` e `[Período de Tempo]` para verificar o histórico de alterações críticas, garantindo total conformidade e segurança.
* **Visão de Cockpit:** Painel gerencial focado em indicadores de alto nível (Saúde do Ecossistema): volume total de energia transitando na rede, status de comunicação das APIs, saúde do simulador (Worker Service), total de sensores ativos/inativos e a fila geral de chamados pendentes.

---

## 👤 2. Cliente (Gestor da Unidade)
O Cliente é o consumidor final. Seu foco é puramente a gestão do próprio patrimônio, buscando economia, controle financeiro e inteligência de consumo.

* **Autocadastro (Onboarding):** Realiza seu próprio registro de usuário diretamente na *Home* do sistema, com autonomia total para criar e gerenciar seu acesso.
* **Gestão da Unidade Consumidora:** Cadastra os dados de sua residência ou comércio, inserindo endereço (com validação automatizada via ViaCEP e IBGE para o código da residência) e tipologia do imóvel (Casa, Apartamento, Comercial) para calibrar a precisão dos relatórios.
* **Solicitação de Perícia:** Lista os aparelhos físicos que deseja monitorar e abre um chamado técnico no sistema. Acompanha o progresso em tempo real através da esteira de status: `Pendente` ➔ `Em Análise` ➔ `Validado`.
* **Gerenciamento de Metas:** Propõe limites de consumo (em kWh ou R$) para dispositivos específicos, justificando a solicitação (ex: *"Viagem programada, quero que o consumo seja o mínimo possível"*). A solicitação entra na fila de avaliação do Operador.
* **Monitoramento e Eficiência:** 
    * Visualização detalhada em tempo real do consumo (kWh) e do custo estimado (R$) por aparelho.
    * Acesso a projeções financeiras estimadas para o fechamento do mês corrente.
    * Comparativos de eficiência baseados em sua região (cruzamento via CEP ou código IBGE) e tipo de imóvel.
* **Alertas Inteligentes:** Recebe notificações preventivas e explicativas cruzadas com dados externos (ex: *"Possível pico de consumo detectado. As temperaturas na sua cidade devem subir para 38°C hoje, ajuste o uso do ar-condicionado"*).

---

## 🛠️ 3. Operador (Consultor e Técnico de Operações)
O Operador é o elo técnico entre o sistema e a rede física. Ele gerencia o hardware, valida as instalações, garante a integridade dos dados e presta consultoria ativa aos clientes.

* **Gestão de Hardware e Categorias (CRUD):** Possui autonomia para cadastrar novos modelos e tipos de sensores no estoque lógico do sistema. Também é o responsável por criar e gerenciar as categorias de aparelhos eletrônicos (ex: "Climatização", "Linha Branca", "Eletrônicos").
* **Gestão de Chamados e Perícias:** Recebe, tria e analisa as solicitações de monitoramento abertas pelos Clientes.
* **Finalização da Perícia e Provisionamento:** Ao aprovar um chamado, o Operador insere os dados vitais no sistema: classifica o aparelho na categoria correta, associa o *Dispositivo* lógico a um *Sensor* físico específico, e valida a comunicação inicial da telemetria.
* **Diagnóstico e Análise de Metas:**
    * Avalia a viabilidade das metas de consumo propostas pelos clientes.
    * Pode aprovar a meta ou devolvê-la com ressalvas, enviando orientações (ex: *"A meta solicitada prejudicará o funcionamento do seu equipamento. Sugerimos um limite X"*).
    * Gera **Relatórios Técnicos Formais** (ex: *"Detectado funcionamento irregular no motor do dispositivo. Sugerida manutenção física"*).
* **Controle e Limitação Remota:** Autonomia para intervir ativamente no fornecimento. Em cenários de anomalia grave ou a pedido do cliente (modo viagem), pode acionar a limitação ou o corte remoto de energia de um dispositivo específico.
* **Gestão de Saúde do Ativo:** Monitora a estabilidade dos sensores. Caso um equipamento apresente defeito (ruído ou pacotes corrompidos), suspende temporariamente o ativo no sistema, isolando o problema e evitando o disparo de falsos positivos para o Cliente.


---

## ⚙️ 4. Arquitetura de Processamento e Telemetria (Worker Service)
Para garantir que o sistema funcione de forma autônoma, em tempo real e sem comprometer a performance, o projeto utiliza um **Worker Service (.NET Background Service)** executado em segundo plano.

* **Simulação de Telemetria IoT:** O Worker atua como o substituto do hardware real. Continuamente, ele percorre a base de `Sensores` ativos, gera valores de consumo coerentes e realiza a persistência massiva no banco de dados (SQL Server).
* **Processamento de Regras e Alertas:** Imediatamente após a inserção dos dados, o Worker verifica se o consumo de um dispositivo ultrapassou a `Meta` estabelecida. Em caso positivo, o alerta é gerado e enviado ao Operador/Cliente de forma assíncrona.
* **Gestão de Cache de APIs Externas:** Para evitar o esgotamento das chaves de acesso (estouro de *rate limit*), o Worker consulta o clima (OpenWeather) e dados demográficos (IBGE) em intervalos programados (ex: a cada 1 hora) e os armazena no banco de dados local. A API principal consulta este cache interno, garantindo altíssima disponibilidade e velocidade, sem custos adicionais de requisição.

Conexão para o banco de dados:
Server=(localdb)\\MSSQLLocalDB;Database=GreenEnergyDB;Trusted_Connection=True;TrustServerCertificate=True;