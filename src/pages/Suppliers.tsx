
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  User, 
  Phone, 
  CreditCard, 
  X, 
  Save, 
  Trash2,
  Building2,
  Mail,
  AlertCircle
} from 'lucide-react';
import { AppState, Supplier } from '../types';

interface SuppliersProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Suppliers: React.FC<SuppliersProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Supplier>>({
    name: '',
    cnpj: '',
    phone: '',
    email: ''
  });

  const filteredSuppliers = state.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.cnpj.includes(searchTerm) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funções de Máscara
  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '') // Remove tudo o que não é dígito
      .replace(/^(\d{2})(\d)/, '$1.$2') // Coloca ponto após os 2 primeiros dígitos
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3') // Coloca ponto após os 3 próximos
      .replace(/\.(\d{3})(\d)/, '.$1/$2') // Coloca barra após os 3 próximos
      .replace(/(\d{4})(\d)/, '$1-$2') // Coloca hífen antes dos 2 últimos
      .substring(0, 18); // Limita o tamanho
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const handleSave = () => {
    if (!form.name || !form.cnpj) {
      alert("Razão Social e CNPJ são campos obrigatórios.");
      return;
    }

    const newSupplier: Supplier = {
      id: Math.random().toString(36).substr(2, 9),
      name: form.name || '',
      cnpj: form.cnpj || '',
      phone: form.phone || '',
      email: form.email || ''
    };

    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));

    setIsModalOpen(false);
    setForm({ name: '', cnpj: '', phone: '', email: '' });
  };

  const handleDelete = (id: string) => {
    // Check if supplier has contracts
    const hasContracts = state.contracts.some(c => c.supplierId === id);
    if (hasContracts) {
      alert("Não é possível excluir este fornecedor pois ele possui contratos ativos. Remova os contratos primeiro.");
      return;
    }

    if (window.confirm("Atenção: Você tem certeza que deseja excluir este fornecedor permanentemente?")) {
      setState(prev => ({
        ...prev,
        suppliers: prev.suppliers.filter(s => s.id !== id)
      }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fornecedores</h2>
          <p className="text-slate-500 dark:text-slate-400">Cadastro centralizado de empresas parceiras.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Cadastrar Fornecedor
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Filtrar por nome, documento ou email..." 
          className="flex-1 outline-none text-slate-700 dark:text-slate-200 font-medium bg-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredSuppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/40 transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 dark:bg-blue-900/20 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
              
              <div className="relative flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-blue-900/30">
                    <Building2 size={24} />
                  </div>
                  <button 
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1 truncate pr-4">{supplier.name}</h3>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <CreditCard size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium">{supplier.cnpj}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <Mail size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium truncate">{supplier.email || 'Email não informado'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                    <Phone size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-medium">{supplier.phone || 'Telefone não informado'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo no Sistema</div>
                <button className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:underline">Detalhes</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-inner">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Building2 size={40} className="opacity-20" />
          </div>
          <p className="font-bold text-lg text-slate-400">Nenhum fornecedor cadastrado.</p>
          <p className="text-sm mt-1">Clique em "Cadastrar Fornecedor" para começar.</p>
        </div>
      )}

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md overflow-hidden flex flex-col shadow-2xl scale-in-center border border-white/10">
            <div className="px-8 py-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                <Building2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Novo Fornecedor</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Preencha os dados oficiais da empresa.</p>
            </div>

            <div className="px-8 pb-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Razão Social *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Nome da empresa" 
                    className="w-full pl-12 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">CNPJ *</label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="00.000.000/0000-00" 
                    className="w-full pl-12 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={form.cnpj}
                    onChange={(e) => setForm({...form, cnpj: formatCNPJ(e.target.value)})}
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    type="email" 
                    placeholder="contato@empresa.com" 
                    className="w-full pl-12 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="(00) 0000-0000" 
                    className="w-full pl-12 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 transition-all font-medium text-slate-700 dark:text-slate-200"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: formatPhone(e.target.value)})}
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 dark:shadow-blue-900/30"
                >
                  <Save size={20} />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
