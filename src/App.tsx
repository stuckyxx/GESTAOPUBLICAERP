
import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useParams, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Wallet, 
  Settings, 
  Menu, 
  Users,
  Moon,
  Sun,
  ClipboardList,
  LogOut,
  ArrowLeft,
  FileBadge,
  Maximize,
  Minimize,
  Cloud,
  CloudOff,
  Gavel,
  Building2
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Atas from './pages/Atas'; 
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Financial from './pages/Financial';
import Suppliers from './pages/Suppliers';
import ServiceOrders from './pages/ServiceOrders';
import SettingsPage from './pages/Settings';
import Login from './pages/Login';
import AdminHome from './pages/AdminHome';
import Landing from './pages/Landing'; 
import Secretariats from './pages/Secretariats';
import Biddings from './pages/Biddings';
import UsersPage from './pages/Users';
import { AppState, SystemUser } from './types';
import { supabase, isConfigured } from './services/supabaseClient';

// Layout do Cliente (Tenant)
const TenantLayout: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');
  const [configError, setConfigError] = useState(false);

  // Auth local para o tenant
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(`auth_${tenantId}`) === 'true';
  });
  
  // Usuário logado
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Estado principal
  const [state, setState] = useState<AppState | null>(null);
  
  // Ref para controlar o debounce do salvamento
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);

  // 1. Carregar Banco de Dados do Cliente (SUPABASE)
  useEffect(() => {
    const loadData = async () => {
      if (!tenantId) return;
      
      if (!isConfigured) {
        setConfigError(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('data')
          .eq('id', tenantId)
          .single();

        if (error) {
          console.error("Erro ao carregar:", error);
          alert("Entidade não encontrada ou erro de conexão.");
          navigate('/');
          return;
        }

        if (data && data.data) {
          const parsedData = data.data;
          
          // Fallback para campos novos
          if (!parsedData.atas) parsedData.atas = [];
          if (!parsedData.users) parsedData.users = [];
          
          setState(parsedData);
        } else {
          // Se não tiver dados no JSON (caso raro)
          alert("Banco de dados corrompido ou vazio.");
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        alert("Erro crítico ao conectar ao banco.");
        navigate('/');
      } finally {
        setLoading(false);
        isFirstLoad.current = false;
      }
    };

    loadData();
  }, [tenantId, navigate]);

  if (configError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
        <CloudOff size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Supabase Não Configurado</h1>
        <p className="text-slate-400 max-w-md mb-8">
          O sistema não conseguiu conectar ao banco de dados. Verifique se as variáveis de ambiente 
          (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) estão configuradas corretamente no arquivo .env.local.
        </p>
        <button 
          onClick={() => navigate('/master-panel')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-colors"
        >
          Ir para Painel Master
        </button>
      </div>
    );
  }

  // 2. Salvar Automaticamente quando o state muda (SUPABASE COM DEBOUNCE)
  useEffect(() => {
    if (isFirstLoad.current || !state || !tenantId) return;

    setSyncStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('tenants')
          .update({ data: state })
          .eq('id', tenantId);

        if (error) throw error;
        setSyncStatus('synced');
      } catch (err) {
        console.error("Erro ao salvar:", err);
        setSyncStatus('error');
      }
    }, 2000); // Salva 2 segundos após a última alteração para evitar spam

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [state, tenantId]);

  // Tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Erro ao tentar ativar tela cheia: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogin = (user: SystemUser) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    sessionStorage.setItem(`auth_${tenantId}`, 'true');
    sessionStorage.setItem(`user_${tenantId}`, JSON.stringify(user));

    if (state) {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action: 'LOGIN',
        details: 'Usuário realizou login no sistema',
        user: user.username
      };
      setState(prev => prev ? ({ ...prev, logs: [newLog, ...(prev.logs || [])] }) : null);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    sessionStorage.removeItem(`auth_${tenantId}`);
    sessionStorage.removeItem(`user_${tenantId}`);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p>Conectando ao banco de dados nuvem...</p>
    </div>
  );

  if (!state) return null;

  if (!isAuthenticated) {
    return (
      <div className="relative">
         <button 
            onClick={() => navigate('/')} 
            className="absolute top-4 left-4 z-50 flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white/50 dark:bg-black/50 p-2 rounded-lg"
         >
           <ArrowLeft size={20} /> Ir para Início
         </button>
         <Login 
            onLogin={handleLogin} 
            users={state.users} 
            entityName={state.entity.name} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
         />
      </div>
    );
  }

  const activeLink = (path: string) => 
    location.pathname.endsWith(path) 
      ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 dark:shadow-blue-900/20" 
      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400";

  const p = `/${tenantId}`;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20">
              G
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-slate-800 dark:text-white leading-tight truncate">Gestão Pública</h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider truncate">{state.entity.name}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto pr-2">
            
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Geral</div>
            <Link to={`${p}/dashboard`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('dashboard')}`}>
              <LayoutDashboard size={20} />
              Painel de Controle
            </Link>

            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Cadastros</div>
            <Link to={`${p}/suppliers`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('suppliers')}`}>
              <Users size={20} />
              Fornecedores
            </Link>
            <Link to={`${p}/secretariats`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('secretariats')}`}>
              <Building2 size={20} />
              Secretarias
            </Link>
            <Link to={`${p}/users`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('users')}`}>
              <Users size={20} />
              Usuários
            </Link>

            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Gestão</div>
            <Link to={`${p}/biddings`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('biddings')}`}>
              <Gavel size={20} />
              Licitações
            </Link>
            <Link to={`${p}/atas`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('atas')}`}>
              <FileBadge size={20} />
              Atas
            </Link>
            <Link to={`${p}/contracts`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('contracts')}`}>
              <FileText size={20} />
              Contratos
            </Link>

            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Ordens</div>
            <Link to={`${p}/service-orders`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('service-orders')}`}>
              <ClipboardList size={20} />
              Ordem de Serviço/Fornecimento
            </Link>

            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Notas Fiscais</div>
            <Link to={`${p}/invoices`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('invoices')}`}>
              <Receipt size={20} />
              Notas Fiscais
            </Link>
            <Link to={`${p}/financial`} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 p-3 rounded-xl transition-all font-medium ${activeLink('financial')}`}>
              <Wallet size={20} />
              Financeiro
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {/* Indicador de Sincronização */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
               <span className="text-slate-500 dark:text-slate-400 font-bold">Status Nuvem:</span>
               {syncStatus === 'synced' && <span className="flex items-center gap-1 text-emerald-500 font-bold"><Cloud size={14} /> Salvo</span>}
               {syncStatus === 'saving' && <span className="flex items-center gap-1 text-blue-500 font-bold"><div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> Salvando...</span>}
               {syncStatus === 'error' && <span className="flex items-center gap-1 text-red-500 font-bold"><CloudOff size={14} /> Erro</span>}
            </div>

            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            <button 
              onClick={toggleFullscreen}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-medium"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            </button>
            <Link 
              to={`${p}/settings`}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-medium ${activeLink('settings')}`}
            >
              <Settings size={20} />
              Configurações
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium mt-2"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-hidden">
        <header className="flex items-center justify-between mb-8 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
            <Menu size={24} />
          </button>
          <div className="font-bold text-slate-800 dark:text-white uppercase tracking-tighter truncate max-w-[200px]">{state.entity.name}</div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        </header>

        <Routes>
          <Route path="/" element={<Navigate to={`${p}/dashboard`} replace />} />
          <Route path="/dashboard" element={<Dashboard state={state} isDarkMode={isDarkMode} />} />
          
          <Route path="/suppliers" element={<Suppliers state={state} setState={setState} />} />
          <Route path="/secretariats" element={<Secretariats state={state} setState={setState} />} />
          <Route path="/users" element={<UsersPage state={state} setState={setState} />} />
          
          <Route path="/biddings" element={<Biddings state={state} setState={setState} />} />
          <Route path="/atas" element={<Atas state={state} setState={setState} />} />
          <Route path="/contracts/*" element={<Contracts state={state} setState={setState} />} />
          
          <Route path="/service-orders" element={<ServiceOrders state={state} setState={setState} />} />
          <Route path="/invoices/*" element={<Invoices state={state} setState={setState} />} />
          <Route path="/financial/*" element={<Financial state={state} setState={setState} />} />
          <Route path="/settings" element={<SettingsPage state={state} setState={setState} />} />
          <Route path="*" element={<Navigate to={`${p}/dashboard`} replace />} />
        </Routes>
      </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/master-panel" element={<AdminHome />} />
      <Route path="/:tenantId/*" element={<TenantLayout />} />
    </Routes>
  );
};

export default App;
