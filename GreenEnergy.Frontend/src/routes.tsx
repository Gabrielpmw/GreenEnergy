import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { PrivateRoute } from './components/PrivateRoute'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'

// Stubs de Páginas do Cliente
const ClienteDashboard = () => <div><h3>Dashboard do Cliente</h3><p>Consumos, metas e previsão climática local.</p></div>
const ClientePerfil = () => <div><h3>Meu Perfil</h3><p>Alteração cadastral e troca de senha.</p></div>
const ClienteUnidades = () => <div><h3>Minhas Unidades</h3><p>Unidades consumidoras cadastradas.</p></div>
const ClienteUnidadesNova = () => <div><h3>Cadastrar Unidade</h3><p>Nova unidade consumidora (CEP com ViaCEP).</p></div>
const ClienteUnidadeDetalhe = () => <div><h3>Detalhe da Unidade</h3><p>Endereço e lista de dispositivos integrados.</p></div>
const ClienteDispositivos = () => <div><h3>Meus Dispositivos</h3><p>Gerenciamento de aparelhos cadastrados.</p></div>
const ClienteDispositivoNovo = () => <div><h3>Cadastrar Dispositivo</h3><p>Vincular novo aparelho a uma unidade.</p></div>
const ClienteDispositivoDetalhe = () => <div><h3>Detalhe do Dispositivo</h3><p>Consumo detalhado, anotações e metas.</p></div>
const ClienteChamados = () => <div><h3>Meus Chamados</h3><p>Lista de perícias e desativações solicitadas.</p></div>
const ClienteChamadoNovo = () => <div><h3>Novo Chamado</h3><p>Abertura de chamado técnico de perícia ou remoção.</p></div>
const ClienteMetas = () => <div><h3>Minhas Metas</h3><p>Limite mensal em kWh ou R$.</p></div>
const ClienteMetaNova = () => <div><h3>Nova Meta</h3><p>Proposta de limite para consumo de dispositivo.</p></div>
const ClienteComparativos = () => <div><h3>Comparativos Regionais</h3><p>Consumo médio da rede e eficiência regional.</p></div>
const ClienteTarifas = () => <div><h3>Tarifas</h3><p>Bandeira vigente e histórico tarifário.</p></div>

// Stubs de Páginas do Operador
const OperadorDashboard = () => <div><h3>Painel de Operações</h3><p>Gerenciamento de chamados técnicos e estoque de sensores.</p></div>
const OperadorChamados = () => <div><h3>Fila de Chamados</h3><p>Triagem de instalações, remoções e perícias.</p></div>
const OperadorChamadoDetalhe = () => <div><h3>Detalhe do Chamado</h3><p>Associação de sensor e provisionamento técnico.</p></div>
const OperadorDispositivos = () => <div><h3>Todos os Dispositivos</h3><p>Lista do ecossistema de aparelhos cadastrados.</p></div>
const OperadorDispositivoDetalhe = () => <div><h3>Controle do Dispositivo</h3><p>Limitação, corte e religamento de energia do ativo.</p></div>
const OperadorSensores = () => <div><h3>Estoque de Sensores</h3><p>Sensores disponíveis e vinculados.</p></div>
const OperadorSensorNovo = () => <div><h3>Cadastrar Sensor</h3><p>Entrada de novo hardware no estoque.</p></div>
const OperadorMetas = () => <div><h3>Avaliar Metas</h3><p>Aprovação de limites sugeridos por clientes.</p></div>
const OperadorRelatorios = () => <div><h3>Relatórios Técnicos</h3><p>Ocorrências e laudos de chamados concluídos.</p></div>
const OperadorCategorias = () => <div><h3>Categorias de Aparelhos</h3><p>Gerenciador de tipos de dispositivos no sistema.</p></div>
const OperadorClientes = () => <div><h3>Consultar Clientes</h3><p>Listagem de clientes para análise técnica.</p></div>

// Stubs de Páginas do Administrador
const AdminDashboard = () => <div><h3>Cockpit do Ecossistema</h3><p>Logs, saúde da telemetria e das APIs integradas.</p></div>
const AdminUsuarios = () => <div><h3>Gestão de Usuários</h3><p>Ativação, desativação de clientes e controle de operadores.</p></div>
const AdminOperadorNovo = () => <div><h3>Criar Operador</h3><p>Cadastro de novos técnicos operacionais.</p></div>
const AdminTarifas = () => <div><h3>Gestão de Tarifas</h3><p>Bandeiras e reajustes tarifários homologados.</p></div>
const AdminConfigApis = () => <div><h3>Configuração de APIs</h3><p>Chaves de integração (OpenWeather, IBGE).</p></div>
const AdminAuditoria = () => <div><h3>Logs de Auditoria</h3><p>Logs de ações críticas executadas no sistema.</p></div>

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/cadastro',
    element: <Register />,
  },
  // Rotas Protegidas de Cliente
  {
    path: '/cliente',
    element: (
      <PrivateRoute allowedRoles={['Cliente']}>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { path: 'dashboard', element: <ClienteDashboard /> },
      { path: 'perfil', element: <ClientePerfil /> },
      { path: 'unidades', element: <ClienteUnidades /> },
      { path: 'unidades/nova', element: <ClienteUnidadesNova /> },
      { path: 'unidades/:id', element: <ClienteUnidadeDetalhe /> },
      { path: 'dispositivos', element: <ClienteDispositivos /> },
      { path: 'dispositivos/novo', element: <ClienteDispositivoNovo /> },
      { path: 'dispositivos/:id', element: <ClienteDispositivoDetalhe /> },
      { path: 'chamados', element: <ClienteChamados /> },
      { path: 'chamados/novo', element: <ClienteChamadoNovo /> },
      { path: 'metas', element: <ClienteMetas /> },
      { path: 'metas/nova', element: <ClienteMetaNova /> },
      { path: 'comparativos', element: <ClienteComparativos /> },
      { path: 'tarifas', element: <ClienteTarifas /> },
      { path: '', element: <Navigate to="dashboard" replace /> },
    ],
  },
  // Rotas Protegidas de Operador
  {
    path: '/operador',
    element: (
      <PrivateRoute allowedRoles={['Operador']}>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { path: 'dashboard', element: <OperadorDashboard /> },
      { path: 'chamados', element: <OperadorChamados /> },
      { path: 'chamados/:id', element: <OperadorChamadoDetalhe /> },
      { path: 'dispositivos', element: <OperadorDispositivos /> },
      { path: 'dispositivos/:id', element: <OperadorDispositivoDetalhe /> },
      { path: 'sensores', element: <OperadorSensores /> },
      { path: 'sensores/novo', element: <OperadorSensorNovo /> },
      { path: 'metas', element: <OperadorMetas /> },
      { path: 'relatorios', element: <OperadorRelatorios /> },
      { path: 'categorias', element: <OperadorCategorias /> },
      { path: 'clientes', element: <OperadorClientes /> },
      { path: '', element: <Navigate to="dashboard" replace /> },
    ],
  },
  // Rotas Protegidas de Administrador
  {
    path: '/admin',
    element: (
      <PrivateRoute allowedRoles={['Admin']}>
        <Layout />
      </PrivateRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'usuarios', element: <AdminUsuarios /> },
      { path: 'usuarios/operadores/novo', element: <AdminOperadorNovo /> },
      { path: 'tarifas', element: <AdminTarifas /> },
      { path: 'configuracoes/apis', element: <AdminConfigApis /> },
      { path: 'auditoria', element: <AdminAuditoria /> },
      { path: '', element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
