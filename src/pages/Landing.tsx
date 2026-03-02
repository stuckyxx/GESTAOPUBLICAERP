
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Search, ArrowRight, ShieldCheck, Lock, Settings } from 'lucide-react';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [citySlug, setCitySlug] = useState('');

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (citySlug) {
      // Navega para a rota do cliente
      navigate(`/${citySlug.toLowerCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Botão de Acesso ao Painel Admin */}
      <div className="absolute top-6 right-6 z-20 animate-in fade-in slide-in-from-top-4 duration-700">
        <Link 
          to="/master-panel" 
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700/50 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 transition-all text-xs font-bold uppercase tracking-widest backdrop-blur-md group"
        >
          <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
          Painel Master
        </Link>
      </div>

      {/* Background Effect */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-sm"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/90 to-slate-900"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl text-center space-y-8 animate-in fade-in zoom-in duration-700">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3 hover:rotate-6 transition-transform">
            <span className="text-white font-black text-5xl">G</span>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">
            Gestão Pública <span className="text-blue-500">ERP</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Sistema integrado de controle financeiro e contratual para prefeituras e câmaras municipais.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl shadow-2xl hover:border-white/20 transition-colors">
          <form onSubmit={handleNavigate} className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest text-left ml-1 flex items-center gap-2">
               <Building2 size={14} />
               Acesse o painel da sua entidade
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Digite o identificador (ex: prefeitura-sp)" 
                  className="w-full pl-12 p-4 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all font-medium"
                  value={citySlug}
                  onChange={(e) => setCitySlug(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center active:scale-95"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-left ml-1">
              * Utilize o link fornecido pelo administrador do sistema.
            </p>
          </form>
        </div>

        <div className="pt-8 flex items-center justify-center gap-2 text-slate-600 text-xs font-medium">
          <ShieldCheck size={14} />
          <span>Ambiente Seguro SSL • Acesso Restrito</span>
        </div>

      </div>
    </div>
  );
};

export default Landing;
