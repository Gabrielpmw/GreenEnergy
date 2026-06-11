import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { PrivateRoute } from './components/PrivateRoute'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'

import { Dashboard as ClienteDashboard } from './pages/cliente/Dashboard'
import { Perfil as ClientePerfil } from './pages/cliente/Perfil'
import { Unidades as ClienteUnidades } from './pages/cliente/Unidades'
import { UnidadesNova as ClienteUnidadesNova } from './pages/cliente/UnidadesNova'
import { UnidadeDetalhe as ClienteUnidadeDetalhe } from './pages/cliente/UnidadeDetalhe'
import { Dispositivos as ClienteDispositivos } from './pages/cliente/Dispositivos'
import { DispositivoNovo as ClienteDispositivoNovo } from './pages/cliente/DispositivoNovo'
import { DispositivoDetalhe as ClienteDispositivoDetalhe } from './pages/cliente/DispositivoDetalhe'
import { Tarifas as ClienteTarifas } from './pages/cliente/Tarifas'

import { Chamados as ClienteChamados } from './pages/cliente/Chamados'
import { ChamadoNovo as ClienteChamadoNovo } from './pages/cliente/ChamadoNovo'
import { Metas as ClienteMetas } from './pages/cliente/Metas'
import { MetaNova as ClienteMetaNova } from './pages/cliente/MetaNova'
import { Comparativos as ClienteComparativos } from './pages/cliente/Comparativos'

import { Dashboard as OperadorDashboard } from './pages/operador/Dashboard'
import { Chamados as OperadorChamados } from './pages/operador/Chamados'
import { ChamadoDetalhe as OperadorChamadoDetalhe } from './pages/operador/ChamadoDetalhe'
import { Dispositivos as OperadorDispositivos } from './pages/operador/Dispositivos'
import { DispositivoDetalhe as OperadorDispositivoDetalhe } from './pages/operador/DispositivoDetalhe'
import { Sensores as OperadorSensores } from './pages/operador/Sensores'
import { SensorNovo as OperadorSensorNovo } from './pages/operador/SensorNovo'
import { Metas as OperadorMetas } from './pages/operador/Metas'

import { Relatorios as OperadorRelatorios } from './pages/operador/Relatorios'
import { Categorias as OperadorCategorias } from './pages/operador/Categorias'
import { Clientes as OperadorClientes } from './pages/operador/Clientes'
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard'
import { Usuarios as AdminUsuarios } from './pages/admin/Usuarios'
import { OperadorNovo as AdminOperadorNovo } from './pages/admin/OperadorNovo'
import { Tarifas as AdminTarifas } from './pages/admin/Tarifas'
import { ConfigApis as AdminConfigApis } from './pages/admin/ConfigApis'
import { Auditoria as AdminAuditoria } from './pages/admin/Auditoria'
import { AdminMercadoIbge } from './pages/admin/AdminMercadoIbge'

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
      { path: 'mercado', element: <AdminMercadoIbge /> },
      { path: '', element: <Navigate to="dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
])
