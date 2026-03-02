
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  User, 
  Mail, 
  Trash2, 
  Save, 
  X,
  Briefcase
} from 'lucide-react';
import { AppState, Secretariat } from '../types';

interface SecretariatsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Secretariats: React.FC<SecretariatsProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Secretariat>>({
    name: '',
    responsible: '',
    email: ''
  });

  const filtered = (state.secretariats || []).filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.responsible.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!form.name) {
      alert("Nome da secretaria é obrigatório.");
      return;
    }

    const newSec: Secretariat = {
      id: Math.random().toString(36).substr(2, 9),
      name: form.name,
      responsible: form.responsible || '',
      email: form.email || ''
    };

    setState(prev => ({
      ...prev,
      secretariats: [...(prev.secretariats || []), newSec]
    }));

    setIsModalOpen(false);
    setForm({ name: '', responsible: '', email: '' });
  };

  const handleDelete = (id: string) => {
    // Check dependencies
    const hasDist = state.atas.some(a => a.distributions.some(d => d.secretariatId === id));
    const hasContract = state.contracts.some(c => c.secretariatId === id);
    
    if (hasDist || hasContract) {
      alert("Não é possível excluir: Esta secretaria possui vínculos com Atas ou Contratos.");
      return;
    }

    if (confirm("Excluir esta secretaria?")) {
      setState(prev => ({
        ...prev,
        secretariats: prev.secretariats.filter(s => s.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Secretarias</h2>
          <p className="text-slate-500 dark:text-slate-400">Cadastro de unidades administrativas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Nova Secretaria
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar secretaria..." 
          className="flex-1 outline-none text-slate-700 dark:text-slate-200 font-medium bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(sec => (
          <div key={sec.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <button 
                onClick={() => handleDelete(sec.id)}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{sec.name}</h3>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <User size={16} />
                <span>{sec.responsible || 'Responsável não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Mail size={16} />
                <span>{sec.email || 'Email não informado'}</span>
              </div>
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma secretaria cadastrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Nova Secretaria</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome da Secretaria *</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-bold"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Ex: Secretaria de Saúde"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Responsável</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.responsible}
                    onChange={e => setForm({...form, responsible: e.target.value})}
                    placeholder="Nome do Secretário(a)"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email de Contato</label>
                  <input 
                    type="email" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="contato@secretaria.gov.br"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secretariats;
