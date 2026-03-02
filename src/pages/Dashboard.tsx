
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  DollarSign, 
  Briefcase, 
  FileCheck2,
  TrendingDown,
  Clock,
  Gavel,
  FileBadge,
  FileText,
  ClipboardList,
  Receipt,
  Wallet
} from 'lucide-react';
import { AppState } from '../types';

interface DashboardProps {
  state: AppState;
  isDarkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ state, isDarkMode = false }) => {
  const totalContracted = state.contracts.reduce((acc, c) => acc + (Number(c.globalValue) || 0), 0);
  
  const totalPaid = state.invoices
    .filter(i => i.isPaid)
    .reduce((acc, i) => acc + (Number(i.payment?.amountPaid) || 0), 0);
    
  const totalPending = state.invoices
    .filter(i => !i.isPaid)
    .reduce((acc, i) => acc + i.items.reduce((s, item) => s + (Number(item.totalValue) || 0), 0), 0);
  
  const balanceAvailable = totalContracted - totalPaid;

  const chartData = state.contracts.map(c => ({
    name: c.number,
    valor: Number(c.globalValue) || 0,
    executado: state.invoices
      .filter(i => i.contractId === c.id)
      .reduce((acc, i) => {
        return acc + i.items.reduce((sum, item) => sum + (Number(item.totalValue) || 0), 0);
      }, 0)
  }));

  const pieData = [
    { name: 'Executado (Pago)', value: totalPaid || 0, color: '#3b82f6' },
    { name: 'Pendente Pagamento', value: totalPending || 0, color: '#f97316' },
    { name: 'Saldo Disponível', value: Math.max(0, (balanceAvailable - totalPending) || 0), color: isDarkMode ? '#1e293b' : '#e2e8f0' }
  ];

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';
  const tooltipText = isDarkMode ? '#f1f5f9' : '#1e293b';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Acesso Rápido - Grupos Organizados */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Acesso Rápido</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRUPO GESTÃO */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Briefcase size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Gestão</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <Link to="../biddings" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
                <Gavel size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">Licitações</span>
              </Link>

              <Link to="../atas" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-all group border border-transparent hover:border-purple-200 dark:hover:border-purple-800">
                <FileBadge size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">Atas</span>
              </Link>

              <Link to="../contracts" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all group border border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                <FileText size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">Contratos</span>
              </Link>
            </div>
          </div>

          {/* GRUPO ORDENS */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <ClipboardList size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Ordens</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Link to="../service-orders" className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400 transition-all group border border-transparent hover:border-orange-200 dark:hover:border-orange-800">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <ClipboardList size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-orange-700 dark:group-hover:text-orange-300">Ordem de Serviço/Fornecimento</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Gerenciar solicitações</span>
                </div>
              </Link>
            </div>
          </div>

          {/* GRUPO FISCAL / FINANCEIRO */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Receipt size={18} />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Notas Fiscais</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Link to="../invoices" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
                <Receipt size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">Notas Fiscais</span>
              </Link>

              <Link to="../financial" className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-all group border border-transparent hover:border-teal-200 dark:hover:border-teal-800">
                <Wallet size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center leading-tight">Financeiro</span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Visão Geral</h2>
        <p className="text-slate-500 dark:text-slate-400">Acompanhamento de execução orçamentária e contratos.</p>
      </div>

      {/* Grid ajustado para 5 cards em telas largas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        
        {/* Card 1: Total Contratado */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Valor Total Contratado</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalContracted)}
            </h3>
          </div>
        </div>

        {/* Card 2: Contratos Ativos */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Briefcase size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Contratos Ativos</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{state.contracts.length}</h3>
          </div>
        </div>

        {/* Card 3: Notas Pendentes (NOVO) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
              <Clock size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Notas Pendentes</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(totalPending)}
            </h3>
            <p className="text-[10px] text-orange-500 font-bold mt-1">Aguardando Pagamento</p>
          </div>
        </div>

        {/* Card 4: Notas Pagas */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <FileCheck2 size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Notas Pagas</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
               {state.invoices.filter(i => i.isPaid).length} <span className="text-sm text-slate-400 font-normal">notas</span>
            </h3>
          </div>
        </div>

        {/* Card 5: Saldo Disponível */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center">
              <TrendingDown size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Saldo Global</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white truncate">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(balanceAvailable)}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Execução por Contrato</h3>
          <div className="h-80 w-full" style={{ minHeight: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: axisColor, fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: isDarkMode ? '#334155' : '#f8fafc'}}
                  contentStyle={{
                    borderRadius: '12px', 
                    border: isDarkMode ? '1px solid #334155' : 'none', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: tooltipBg,
                    color: tooltipText
                  }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText, fontWeight: 'bold' }}
                />
                <Bar dataKey="valor" fill={isDarkMode ? '#334155' : '#e2e8f0'} radius={[4, 4, 0, 0]} name="Valor Global" />
                <Bar dataKey="executado" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Valor Executado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col min-w-0">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Proporção Orçamentária</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
             <div className="h-64 w-full" style={{ minHeight: '256px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke={isDarkMode ? '#0f172a' : '#fff'}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '12px', 
                      border: isDarkMode ? '1px solid #334155' : 'none', 
                      backgroundColor: tooltipBg,
                      color: tooltipText
                    }}
                    itemStyle={{ color: tooltipText }}
                  />
                </PieChart>
              </ResponsiveContainer>
             </div>
             <div className="space-y-3 w-full mt-4">
               {pieData.map(item => (
                 <div key={item.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}} />
                     <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                   </div>
                   <span className="font-bold text-slate-800 dark:text-white">
                     {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(item.value)}
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
