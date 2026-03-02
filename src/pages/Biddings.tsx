
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Gavel, 
  Calendar, 
  FileText, 
  Trash2, 
  Save, 
  X,
  Archive,
  Pencil
} from 'lucide-react';
import { AppState, Bidding } from '../types';

interface BiddingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Biddings: React.FC<BiddingsProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Bidding>>({
    processNumber: '',
    year: new Date().getFullYear().toString(),
    modality: '',
    object: '',
    status: 'open'
  });

  const filtered = (state.biddings || []).filter(b => 
    b.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.object.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (bidding: Bidding) => {
    setForm({
      processNumber: bidding.processNumber,
      year: bidding.year,
      modality: bidding.modality,
      object: bidding.object,
      status: bidding.status
    });
    setIsModalOpen(true);
    // Store the ID being edited in a ref or state variable not shown in the original snippet
    // Since I can't easily add a new state variable without replacing the whole component, 
    // I will use a slightly different approach or assume I can replace the component body.
    // Actually, I'll use a state for editingId.
    setEditingId(bidding.id);
  };

  const handleSave = () => {
    if (!form.processNumber || !form.modality || !form.object) {
      alert("Preencha Processo, Modalidade e Objeto.");
      return;
    }

    const newBidding: Bidding = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      processNumber: form.processNumber,
      year: form.year || new Date().getFullYear().toString(),
      modality: form.modality,
      object: form.object,
      status: form.status as any || 'open',
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      biddings: editingId 
        ? prev.biddings.map(b => b.id === editingId ? newBidding : b)
        : [...(prev.biddings || []), newBidding]
    }));

    setIsModalOpen(false);
    setEditingId(null);
    setForm({ processNumber: '', year: new Date().getFullYear().toString(), modality: '', object: '', status: 'open' });
  };

  const handleDelete = (id: string) => {
    const hasAta = state.atas.some(a => a.biddingId === id);
    if (hasAta) {
      alert("Não é possível excluir: Existem Atas vinculadas a esta licitação.");
      return;
    }

    if (confirm("Excluir esta licitação?")) {
      setState(prev => ({
        ...prev,
        biddings: prev.biddings.filter(b => b.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Licitações</h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de Processos Licitatórios.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Nova Licitação
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nº processo ou objeto..." 
          className="flex-1 outline-none text-slate-700 dark:text-slate-200 font-medium bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(bidding => (
          <div key={bidding.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-all">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                    bidding.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 
                    bidding.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {bidding.status === 'open' ? 'Aberta' : bidding.status === 'closed' ? 'Encerrada' : 'Suspensa'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{bidding.year}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Gavel size={20} className="text-blue-500" />
                  Processo: {bidding.processNumber}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{bidding.modality}</p>
                <p className="text-xs text-slate-400 mt-2 max-w-3xl">{bidding.object}</p>
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => handleEdit(bidding)}
                  className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                >
                  <Pencil size={18} />
                </button>
                 <button 
                  onClick={() => handleDelete(bidding.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Archive size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma licitação encontrada.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">{editingId ? 'Editar Licitação' : 'Nova Licitação'}</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Processo Nº *</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-bold"
                    value={form.processNumber}
                    onChange={e => setForm({...form, processNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Exercício (Ano)</label>
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.year}
                    onChange={e => setForm({...form, year: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Modalidade *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Pregão Eletrônico 001/2024"
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.modality}
                    onChange={e => setForm({...form, modality: e.target.value})}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Objeto *</label>
                  <textarea 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white h-24 resize-none"
                    value={form.object}
                    onChange={e => setForm({...form, object: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Status</label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value as any})}
                  >
                    <option value="open">Aberta</option>
                    <option value="closed">Encerrada</option>
                    <option value="suspended">Suspensa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsModalOpen(false); setEditingId(null); setForm({ processNumber: '', year: new Date().getFullYear().toString(), modality: '', object: '', status: 'open' }); }} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biddings;
