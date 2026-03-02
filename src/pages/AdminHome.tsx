
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Database, 
  ArrowRight, 
  Trash2, 
  ShieldCheck,
  Server,
  LayoutDashboard,
  Lock,
  LogOut,
  AlertTriangle,
  ArrowLeft,
  Settings,
  Users,
  History,
  Save,
  X,
  UserPlus,
  Activity,
  Key
} from 'lucide-react';
import { Tenant, AppState, SystemUser, SystemLog } from '../types';
import { supabase, isConfigured } from '../services/supabaseClient';

const AdminHome: React.FC = () => {
  const navigate = useNavigate();
  
  // Auth State
  const [isMasterAuthenticated, setIsMasterAuthenticated] = useState(() => {
    return sessionStorage.getItem('master_auth') === 'true';
  });
  const [masterPassword, setMasterPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tenants Data
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // --- MANAGER STATE (Gestão de um banco específico) ---
  const [managedTenantId, setManagedTenantId] = useState<string | null>(null);
  const [managedDb, setManagedDb] = useState<AppState | null>(null);
  const [isManagerLoading, setIsManagerLoading] = useState(false);
  const [managerTab, setManagerTab] = useState<'info' | 'users' | 'logs' | 'config'>('info');
  
  // New User Form State
  const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', role: 'viewer' });

  // Load Tenants from Supabase
  useEffect(() => {
    if (isMasterAuthenticated) {
      if (!isConfigured) {
        setConnectionError("Supabase não configurado. Verifique as variáveis de ambiente (.env.local).");
        return;
      }

      const fetchTenants = async () => {
        setIsLoadingTenants(true);
        setConnectionError(null);
        try {
          const { data, error } = await supabase.from('tenants').select('id, name, created_at');
          if (error) {
            console.error("Erro ao carregar tenants:", error);
            setConnectionError(`Erro ao conectar ao Supabase: ${error.message}`);
          } else {
            setTenants(data.map((t: any) => ({
              id: t.id,
              name: t.name,
              createdAt: t.created_at
            })));
          }
        } catch (err: any) {
          console.error("Erro de conexão:", err);
          setConnectionError("Falha na conexão com o Supabase. Verifique sua internet ou a URL do projeto.");
        } finally {
          setIsLoadingTenants(false);
        }
      };
      fetchTenants();
    }
  }, [isMasterAuthenticated]);

  // Load Managed Database
  useEffect(() => {
    if (managedTenantId) {
      const fetchDb = async () => {
        setIsManagerLoading(true);
        const { data, error } = await supabase.from('tenants').select('data').eq('id', managedTenantId).single();
        if (error) {
          console.error("Erro ao ler banco:", error);
          alert("Não foi possível ler os dados do banco.");
          setManagedTenantId(null);
        } else {
          let dbData: AppState = data.data;
          if (!dbData.users) dbData.users = [];
          if (!dbData.logs) dbData.logs = [];
          if (!dbData.atas) dbData.atas = [];
          setManagedDb(dbData);
        }
        setIsManagerLoading(false);
      };
      fetchDb();
    } else {
      setManagedDb(null);
    }
  }, [managedTenantId]);

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword === 'admin') {
      setIsMasterAuthenticated(true);
      sessionStorage.setItem('master_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Credencial de acesso negada.');
    }
  };

  const handleCreateTenant = async () => {
    if (!newOrgName || !newOrgSlug) {
      alert("Preencha o nome e o identificador (slug).");
      return;
    }
    const sanitizedSlug = newOrgSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Check local duplicate in list
    if (tenants.find(t => t.id === sanitizedSlug)) {
      alert("Este identificador já existe na lista.");
      return;
    }

    // Initial DB State
    const initialDbState: AppState = {
      entity: {
        name: newOrgName.toUpperCase(),
        secretary: 'Secretaria Administrativa',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        website: ''
      },
      users: [
        {
          id: 'admin-1',
          name: 'Administrador Padrão',
          username: 'admin',
          password: '123',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      logs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'DB_CREATED',
          details: 'Banco de dados inicializado pelo Painel Master (Supabase)',
          user: 'MASTER'
        }
      ],
      suppliers: [],
      secretariats: [],
      biddings: [],
      accounts: [],
      atas: [],
      contracts: [],
      invoices: [],
      serviceOrders: []
    };

    const { error } = await supabase.from('tenants').insert({
      id: sanitizedSlug,
      name: newOrgName,
      data: initialDbState
    });

    if (error) {
      console.error(error);
      alert(`Erro ao criar: ${error.message}`);
      return;
    }

    const newTenant: Tenant = {
      id: sanitizedSlug,
      name: newOrgName,
      createdAt: new Date().toISOString()
    };

    setTenants([...tenants, newTenant]);
    setIsCreating(false);
    setNewOrgName('');
    setNewOrgSlug('');
  };

  const handleDeleteTenant = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`ATENÇÃO: Isso excluirá TODO o banco de dados de "${id}" da NUVEM. Esta ação é irreversível. Confirmar?`)) {
      const { error } = await supabase.from('tenants').delete().eq('id', id);
      if (error) {
        alert("Erro ao excluir: " + error.message);
      } else {
        setTenants(tenants.filter(t => t.id !== id));
      }
    }
  };

  // --- MANAGER ACTIONS ---

  const saveManagedDb = async (updatedDb: AppState, logAction?: string, logDetails?: string) => {
    if (!managedTenantId) return;

    if (logAction) {
      const newLog: SystemLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action: logAction,
        details: logDetails || '',
        user: 'MASTER_PANEL'
      };
      updatedDb.logs = [newLog, ...updatedDb.logs];
    }

    const { error } = await supabase
      .from('tenants')
      .update({ data: updatedDb })
      .eq('id', managedTenantId);

    if (error) {
      alert("Erro ao salvar alterações no Supabase: " + error.message);
    } else {
      setManagedDb(updatedDb);
    }
  };

  const handleAddUser = () => {
    if (!managedDb) return;
    if (!newUserForm.name || !newUserForm.username || !newUserForm.password) {
      alert("Preencha todos os campos do usuário.");
      return;
    }

    const newUser: SystemUser = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUserForm.name,
      username: newUserForm.username,
      password: newUserForm.password,
      role: newUserForm.role as 'admin' | 'viewer',
      createdAt: new Date().toISOString()
    };

    const updatedDb = { ...managedDb, users: [...managedDb.users, newUser] };
    saveManagedDb(updatedDb, 'USER_CREATED', `Usuário ${newUser.username} criado via Painel Master`);
    setNewUserForm({ name: '', username: '', password: '', role: 'viewer' });
    alert("Usuário adicionado com sucesso.");
  };

  const handleRemoveUser = (userId: string) => {
    if (!managedDb) return;
    if (confirm("Remover este usuário?")) {
       const updatedDb = { ...managedDb, users: managedDb.users.filter(u => u.id !== userId) };
       saveManagedDb(updatedDb, 'USER_DELETED', `Usuário ID ${userId} removido via Painel Master`);
    }
  };

  const handleUpdateConfig = () => {
    if (!managedDb) return;
    saveManagedDb(managedDb, 'CONFIG_UPDATED', 'Configurações da entidade atualizadas via Painel Master');
    alert("Configurações salvas no banco do cliente.");
  };

  // -----------------------

  if (!isMasterAuthenticated) {
    return (
       <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Voltar ao Início
        </button>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
              <Lock size={32} className="text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white text-center mb-2">Painel Master</h2>
          <p className="text-slate-400 text-center text-sm mb-8">Área exclusiva para criação e gestão de bancos de dados dos clientes.</p>
          
          <form onSubmit={handleMasterLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha Mestra</label>
              <input 
                type="password" 
                className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-bold"
                placeholder="••••••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-950/30 p-3 rounded-lg border border-red-900/50">
                <AlertTriangle size={14} />
                {authError}
              </div>
            )}

            <button type="submit" className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">
              Acessar Gerenciador
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Navbar Admin */}
      <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">Painel Central</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gestão de Instâncias (Supabase)</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsMasterAuthenticated(false);
              sessionStorage.removeItem('master_auth');
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg transition-all text-xs font-bold border border-slate-700"
          >
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Clientes & Bancos de Dados</h2>
            <p className="text-slate-400 max-w-xl">
              Gerencie as instâncias do sistema hospedadas no Supabase.
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/40 hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Nova Instância
          </button>
        </div>

        {connectionError && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Erro de Conexão</h3>
              <p className="text-red-300 mb-4">{connectionError}</p>
              <div className="text-xs font-mono bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-400">
                <p className="mb-2 font-bold text-slate-300">Como corrigir:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Crie um projeto no <a href="https://supabase.com" target="_blank" className="text-indigo-400 hover:underline">Supabase.com</a></li>
                  <li>Crie a tabela <strong>tenants</strong> no SQL Editor (veja instruções abaixo)</li>
                  <li>Copie a <strong>Project URL</strong> e <strong>anon public key</strong></li>
                  <li>Edite o arquivo <strong>.env.local</strong> na raiz do projeto</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {isLoadingTenants ? (
          <div className="text-center py-20 text-slate-500">Carregando tenants...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map(tenant => (
              <div 
                key={tenant.id}
                className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-2xl p-6 transition-all relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-colors">
                    <Database className="text-slate-400 group-hover:text-indigo-400" size={24} />
                  </div>
                  <div className="flex gap-2">
                    {/* Botão GERENCIAR */}
                    <button 
                      onClick={() => setManagedTenantId(tenant.id)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors z-10"
                      title="Configurar Banco e Usuários"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteTenant(e, tenant.id)}
                      className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors z-10"
                      title="Excluir Banco"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1">{tenant.name}</h3>
                <p className="text-sm text-slate-400 font-mono mb-6">/{tenant.id}</p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Server size={12} />
                    Online
                  </span>
                  <button 
                    onClick={() => navigate(`/${tenant.id}`)}
                    className="flex items-center gap-1 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Acessar App <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {tenants.length === 0 && (
              <div 
                onClick={() => setIsCreating(true)}
                className="col-span-full border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-900/50"
              >
                <LayoutDashboard size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Nenhum cliente cadastrado</h3>
                <p className="text-slate-500 mt-2">Clique aqui para criar o primeiro banco de dados.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL CRIAR INSTÂNCIA */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Novo Cliente</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Nome da Entidade</label>
                <input 
                  type="text"
                  placeholder="Ex: Prefeitura Municipal..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Slug (URL)</label>
                <input 
                  type="text"
                  placeholder="nome-do-municipio"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-colors"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase())}
                />
              </div>
              <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-xs text-indigo-300">
                <p className="font-bold mb-1">Acesso Inicial:</p>
                <p>Usuário: <strong>admin</strong></p>
                <p>Senha: <strong>123</strong></p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors">Cancelar</button>
              <button onClick={handleCreateTenant} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg">Criar Banco</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GERENCIADOR DO BANCO (FULL SCREEN DRAWER) */}
      {managedTenantId && managedDb && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-5xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                    <Database size={24} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-white">{managedDb.entity.name}</h2>
                   <p className="text-slate-400 text-sm font-mono">ID: {managedTenantId}</p>
                 </div>
              </div>
              <button onClick={() => setManagedTenantId(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900 px-6 gap-6">
              <button 
                onClick={() => setManagerTab('info')}
                className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${managerTab === 'info' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Activity size={16} /> Visão Geral
              </button>
              <button 
                onClick={() => setManagerTab('config')}
                className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${managerTab === 'config' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Building2 size={16} /> Configurações do Banco
              </button>
              <button 
                onClick={() => setManagerTab('users')}
                className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${managerTab === 'users' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <Users size={16} /> Usuários & Acesso
              </button>
              <button 
                onClick={() => setManagerTab('logs')}
                className={`py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${managerTab === 'logs' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                <History size={16} /> Logs de Auditoria
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
              
              {isManagerLoading ? (
                <div className="text-center text-white">Carregando dados do tenant...</div>
              ) : (
                <>
                  {/* TAB: INFO */}
                  {managerTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Tamanho Estimado</p>
                          <p className="text-3xl font-black text-white">{(JSON.stringify(managedDb).length / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Contratos Registrados</p>
                          <p className="text-3xl font-black text-white">{managedDb.contracts.length}</p>
                      </div>
                      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-2">Usuários Ativos</p>
                          <p className="text-3xl font-black text-white">{managedDb.users?.length || 0}</p>
                      </div>
                    </div>
                  )}

                  {/* TAB: CONFIGURAÇÕES */}
                  {managerTab === 'config' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4">Dados da Entidade</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Nome da Entidade</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={managedDb.entity.name}
                              onChange={(e) => setManagedDb({...managedDb, entity: {...managedDb.entity, name: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">CNPJ</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={managedDb.entity.cnpj}
                              onChange={(e) => setManagedDb({...managedDb, entity: {...managedDb.entity, cnpj: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Secretaria Padrão</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={managedDb.entity.secretary}
                              onChange={(e) => setManagedDb({...managedDb, entity: {...managedDb.entity, secretary: e.target.value}})}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={handleUpdateConfig}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                        >
                          <Save size={18} /> Salvar Alterações
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: USUÁRIOS */}
                  {managerTab === 'users' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                      
                      {/* Lista de Usuários */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-xs">
                            <tr>
                              <th className="p-4">Nome</th>
                              <th className="p-4">Usuário (Login)</th>
                              <th className="p-4">Permissão</th>
                              <th className="p-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {managedDb.users?.map(user => (
                              <tr key={user.id}>
                                <td className="p-4 font-bold text-white">{user.name}</td>
                                <td className="p-4 font-mono text-indigo-300">{user.username}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => handleRemoveUser(user.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Formulário Novo Usuário */}
                      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <UserPlus size={20} className="text-indigo-400" /> 
                          Adicionar Usuário ao Banco
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Nome Completo</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={newUserForm.name}
                              onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                              placeholder="Ex: João Silva"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Login</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={newUserForm.username}
                              onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})}
                              placeholder="Ex: joao.silva"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Senha</label>
                            <input 
                              type="text" 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={newUserForm.password}
                              onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                              placeholder="***"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-bold uppercase">Perfil</label>
                            <select 
                              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white"
                              value={newUserForm.role}
                              onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                            >
                              <option value="viewer">Visualizador</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                        </div>
                        <button 
                          onClick={handleAddUser}
                          className="mt-4 w-full bg-slate-700 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                          Criar Credencial
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB: LOGS */}
                  {managerTab === 'logs' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                          <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-xs">
                            <tr>
                              <th className="p-4 w-40">Data/Hora</th>
                              <th className="p-4 w-32">Ação</th>
                              <th className="p-4">Detalhes</th>
                              <th className="p-4 w-32 text-right">Usuário</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {managedDb.logs?.map(log => (
                              <tr key={log.id} className="hover:bg-slate-700/30">
                                <td className="p-4 font-mono text-xs text-slate-400">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4">
                                  <span className="bg-slate-900 text-slate-300 px-2 py-1 rounded text-xs font-bold font-mono">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-300">{log.details}</td>
                                <td className="p-4 text-right font-bold text-slate-400">{log.user}</td>
                              </tr>
                            ))}
                            {(!managedDb.logs || managedDb.logs.length === 0) && (
                              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum log registrado.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminHome;
