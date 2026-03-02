
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Trash2, 
  Shield,
  Eye,
  Lock,
  Pencil
} from 'lucide-react';
import { AppState, SystemUser } from '../types';

interface UsersProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Users: React.FC<UsersProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<SystemUser>>({
    name: '',
    username: '',
    password: '',
    role: 'viewer'
  });

  const filtered = (state.users || []).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: SystemUser) => {
      setEditingId(user.id);
      setForm({
          name: user.name,
          username: user.username,
          password: user.password,
          role: user.role
      });
      setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const newUser: SystemUser = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      name: form.name,
      username: form.username,
      password: form.password, // Em produção, usar hash
      role: form.role as 'admin' | 'viewer',
      createdAt: editingId 
        ? (state.users.find(u => u.id === editingId)?.createdAt || new Date().toISOString()) 
        : new Date().toISOString()
    };

    if (editingId) {
        setState(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === editingId ? newUser : u)
        }));
    } else {
        setState(prev => ({
            ...prev,
            users: [...(prev.users || []), newUser]
        }));
    }

    setIsModalOpen(false);
    setEditingId(null);
    setForm({ name: '', username: '', password: '', role: 'viewer' });
  };

  const handleDelete = (id: string) => {
    if (confirm("Excluir este usuário?")) {
      setState(prev => ({
        ...prev,
        users: (prev.users || []).filter(u => u.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Usuários do Sistema</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerenciar acesso ao painel desta entidade.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar usuário..." 
          className="flex-1 outline-none text-slate-700 dark:text-slate-200 font-medium bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(user => (
          <div key={user.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                user.role === 'admin' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {user.role === 'admin' ? <Shield size={24} /> : <Eye size={24} />}
              </div>
              <div className="flex gap-1">
                <button 
                    onClick={() => handleEdit(user)}
                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                >
                    <Pencil size={18} />
                </button>
                <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                    <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{user.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">@{user.username}</p>
            
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950 py-2 px-3 rounded-lg w-fit">
              {user.role === 'admin' ? 'Administrador' : 'Visualizador'}
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <User size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum usuário encontrado.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-bold"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Usuário (Login) *</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.username}
                    onChange={e => setForm({...form, username: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" 
                      className="w-full pl-12 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Permissão</label>
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <button 
                      onClick={() => setForm({...form, role: 'viewer'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${form.role === 'viewer' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400'}`}
                    >
                      Visualizador
                    </button>
                    <button 
                      onClick={() => setForm({...form, role: 'admin'})}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${form.role === 'admin' ? 'bg-white dark:bg-slate-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                    >
                      Administrador
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); setForm({ name: '', username: '', password: '', role: 'viewer' }); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
