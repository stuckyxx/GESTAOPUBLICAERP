
import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Save, 
  Landmark,
  ShieldCheck,
  Mail
} from 'lucide-react';
import { AppState, EntityConfig } from '../types';

interface SettingsProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const SettingsPage: React.FC<SettingsProps> = ({ state, setState }) => {
  // Local state to manage form inputs
  const [form, setForm] = useState<EntityConfig>(state.entity);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field: keyof EntityConfig, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setState(prev => ({
      ...prev,
      entity: form
    }));
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h2>
          <p className="text-slate-500 dark:text-slate-400">Dados da entidade pública para emissão de documentos.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30 active:scale-95"
        >
          <Save size={20} />
          Salvar Alterações
        </button>
      </div>

      {showSuccess && (
        <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <ShieldCheck size={24} />
          <div>
            <p className="font-bold">Sucesso!</p>
            <p className="text-sm">Os dados da entidade foram atualizados e refletirão em todos os relatórios.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Dados Principais */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Card: Identificação */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <Landmark size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Identificação do Órgão</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Nome da Entidade (Razão Social)</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all font-bold text-slate-700 dark:text-white"
                    placeholder="Ex: PREFEITURA MUNICIPAL DE..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Secretaria / Departamento Padrão</label>
                <input 
                  type="text" 
                  value={form.secretary}
                  onChange={(e) => handleChange('secretary', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">CNPJ</label>
                <input 
                  type="text" 
                  value={form.cnpj}
                  onChange={(e) => handleChange('cnpj', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-mono font-medium text-slate-700 dark:text-white"
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>
          </div>

          {/* Card: Endereço */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Localização</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Logradouro / Número</label>
                <input 
                  type="text" 
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                />
              </div>
               <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">CEP</label>
                <input 
                  type="text" 
                  value={form.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Cidade</label>
                <input 
                  type="text" 
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Estado (UF)</label>
                <input 
                  type="text" 
                  value={form.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Contato e Preview */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <Phone size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Contato Oficial</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Telefone Geral</label>
                <input 
                  type="text" 
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email" 
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">Website / Portal</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={form.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="w-full pl-12 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all font-medium text-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 opacity-80">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Pré-visualização (Cabeçalho)</h4>
            
            <div className="bg-white text-black p-4 text-center text-xs shadow-lg rounded-sm">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border border-gray-300">
                  <Building2 size={20} className="text-gray-400" />
                </div>
              </div>
              <p className="font-bold uppercase text-sm mb-1">{form.name || 'Nome da Entidade'}</p>
              <p className="text-gray-600">{form.secretary || 'Departamento'}</p>
              <p className="text-gray-500 text-[10px] mt-2">{form.address}, {form.city}-{form.state} • {form.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
