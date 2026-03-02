
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ClipboardList,
  Eye, 
  Printer, 
  X,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  Pencil,
  Trash2
} from 'lucide-react';
import { AppState, ServiceOrder, ServiceOrderItem } from '../types';

interface ServiceOrdersProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const ServiceOrders: React.FC<ServiceOrdersProps> = ({ state, setState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOS, setViewOS] = useState<ServiceOrder | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [selectedContractId, setSelectedContractId] = useState('');
  const [osType, setOsType] = useState<'service' | 'supply'>('supply');
  const [osDescription, setOsDescription] = useState('');
  const [osDate, setOsDate] = useState(new Date().toISOString().split('T')[0]);
  const [osItems, setOsItems] = useState<ServiceOrderItem[]>([]);

  const selectedContract = useMemo(() => 
    state.contracts.find(c => c.id === selectedContractId), 
    [selectedContractId, state.contracts]
  );

  const handleAddItem = (contractItemId: string) => {
    if (osItems.find(i => i.contractItemId === contractItemId)) return;
    
    const contractItem = selectedContract?.items.find(i => i.id === contractItemId);
    if (!contractItem) return;

    if (contractItem.currentBalance <= 0) {
        alert("Este item não possui saldo disponível.");
        return;
    }

    setOsItems([...osItems, { 
      contractItemId, 
      quantity: 1, 
      unitPrice: contractItem.unitPrice, 
      total: contractItem.unitPrice 
    }]);
  };

  const handleUpdateQty = (contractItemId: string, qty: number) => {
    const contractItem = selectedContract?.items.find(i => i.id === contractItemId);
    if (!contractItem) return;

    if (qty > contractItem.currentBalance) {
        alert(`A quantidade não pode exceder o saldo atual (${contractItem.currentBalance}).`);
        return;
    }

    setOsItems(prev => prev.map(item => {
      if (item.contractItemId === contractItemId) {
        return {
          ...item,
          quantity: qty,
          total: qty * item.unitPrice
        };
      }
      return item;
    }));
  };

  const handleEditOS = (os: ServiceOrder) => {
    setEditingId(os.id);
    setSelectedContractId(os.contractId);
    setOsType(os.type);
    setOsDescription(os.description);
    setOsDate(os.issueDate);
    setOsItems(os.items.map(i => ({...i})));
    setIsModalOpen(true);
  };

  const handleDeleteOS = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta Ordem de Serviço? O saldo do contrato será restaurado.")) return;

    const os = state.serviceOrders.find(o => o.id === id);
    if (!os) return;

    // Restore Contract Balances
    const updatedContracts = state.contracts.map(c => {
        if (c.id === os.contractId) {
            const newItems = c.items.map(cItem => {
                const osItem = os.items.find(i => i.contractItemId === cItem.id);
                if (osItem) {
                    return { ...cItem, currentBalance: cItem.currentBalance + osItem.quantity };
                }
                return cItem;
            });
            return { ...c, items: newItems };
        }
        return c;
    });

    setState(prev => ({
      ...prev,
      serviceOrders: prev.serviceOrders.filter(o => o.id !== id),
      contracts: updatedContracts
    }));
  };

  const handleCreateOS = () => {
    if (!selectedContractId || !osDescription || osItems.length === 0) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const nextNumber = editingId 
        ? state.serviceOrders.find(o => o.id === editingId)?.number || ''
        : (state.serviceOrders.length + 1).toString().padStart(3, '0') + '/' + new Date().getFullYear();

    const newOS: ServiceOrder = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      number: nextNumber,
      type: osType,
      contractId: selectedContractId,
      issueDate: osDate,
      description: osDescription,
      status: 'open',
      items: osItems
    };

    // Update Contract Balances
    const updatedContracts = state.contracts.map(c => {
        if (c.id === selectedContractId) {
            const newItems = c.items.map(cItem => {
                // If editing, first restore old quantity, then subtract new
                let balance = cItem.currentBalance;
                
                if (editingId) {
                    const oldOS = state.serviceOrders.find(o => o.id === editingId);
                    const oldItem = oldOS?.items.find(i => i.contractItemId === cItem.id);
                    if (oldItem) balance += oldItem.quantity;
                }

                const newItem = osItems.find(i => i.contractItemId === cItem.id);
                if (newItem) balance -= newItem.quantity;

                return { ...cItem, currentBalance: balance };
            });
            return { ...c, items: newItems };
        }
        return c;
    });

    setState(prev => ({
      ...prev,
      serviceOrders: editingId 
        ? prev.serviceOrders.map(o => o.id === editingId ? newOS : o)
        : [...prev.serviceOrders, newOS],
      contracts: updatedContracts
    }));

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedContractId('');
    setOsType('supply');
    setOsDescription('');
    setOsItems([]);
    setOsDate(new Date().toISOString().split('T')[0]);
  };

  const getTotalValue = (os: ServiceOrder) => {
    return os.items.reduce((acc, i) => acc + i.total, 0);
  };

  const printOS = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Ordens de Serviço</h2>
          <p className="text-slate-500 dark:text-slate-400">Autorização de fornecimento e execução.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Nova O.S.
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {state.serviceOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <ClipboardList className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
            <p className="text-slate-500 dark:text-slate-400">Nenhuma Ordem de Serviço emitida.</p>
          </div>
        ) : (
          state.serviceOrders.map(os => {
            const contract = state.contracts.find(c => c.id === os.contractId);
            const supplier = state.suppliers.find(s => s.id === contract?.supplierId);
            
            return (
              <div key={os.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">O.S. {os.number}</h3>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          os.status === 'open' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                          os.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {os.status === 'open' ? 'Aberta' : os.status === 'completed' ? 'Faturada' : 'Cancelada'}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                        <Building2 size={14} />
                        {supplier?.name} (Contrato {contract?.number})
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1.5">
                        <Calendar size={14} />
                        Emissão: {new Date(os.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Autorizado</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalValue(os))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditOS(os)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <Pencil size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOS(os.id)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={20} />
                        </button>
                        <button 
                          onClick={() => setViewOS(os)}
                          className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                          title="Visualizar e Imprimir"
                        >
                          <Printer size={20} />
                        </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold">Objeto:</span> {os.description}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL CRIAR OS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-slate-800">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingId ? 'Editar Ordem de Serviço' : 'Emitir Nova Ordem de Serviço'}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contrato Vigente *</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-medium"
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                  >
                    <option value="">Selecione o contrato...</option>
                    {state.contracts.map(c => (
                      <option key={c.id} value={c.id}>Contrato {c.number} - {state.suppliers.find(s => s.id === c.supplierId)?.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Ordem</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${osType === 'supply' ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700'}`}>
                            <input type="radio" name="osType" value="supply" checked={osType === 'supply'} onChange={() => setOsType('supply')} className="hidden" />
                            <span className="font-bold">Fornecimento</span>
                        </label>
                        <label className={`flex-1 p-3 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${osType === 'service' ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700'}`}>
                            <input type="radio" name="osType" value="service" checked={osType === 'service'} onChange={() => setOsType('service')} className="hidden" />
                            <span className="font-bold">Serviço</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Data de Emissão</label>
                  <input 
                    type="date" 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                    value={osDate}
                    onChange={(e) => setOsDate(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Descrição da Solicitação *</label>
                  <textarea 
                    placeholder="Ex: Aquisição de material de expediente para a Secretaria de Educação..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white h-24 resize-none"
                    value={osDescription}
                    onChange={(e) => setOsDescription(e.target.value)}
                  />
                </div>
              </div>

              {selectedContract && (
                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Selecione os Itens para Autorização</h4>
                  
                  {/* Lista de Itens do Contrato para Seleção */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedContract.items.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => handleAddItem(item.id)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all text-left ${
                          osItems.find(i => i.contractItemId === item.id) 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400'
                        }`}
                      >
                        {item.description}
                      </button>
                    ))}
                  </div>

                  {/* Tabela de Itens Selecionados */}
                  {osItems.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <th className="pb-2 pl-2">Item</th>
                            <th className="pb-2 w-24">Qtd. Auth</th>
                            <th className="pb-2 text-right pr-2">Total</th>
                            <th className="w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {osItems.map((osItem, idx) => {
                            const contractItem = selectedContract.items.find(i => i.id === osItem.contractItemId);
                            return (
                              <tr key={idx}>
                                <td className="py-3 pl-2 font-medium text-slate-700 dark:text-slate-300">
                                  {contractItem?.description}
                                  <div className="text-[10px] text-slate-400">Saldo Contratual: {contractItem?.currentBalance} {contractItem?.unit}</div>
                                </td>
                                <td className="py-3">
                                  <input 
                                    type="number" 
                                    className="w-20 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center font-bold"
                                    value={osItem.quantity}
                                    onChange={(e) => handleUpdateQty(osItem.contractItemId, parseFloat(e.target.value))}
                                  />
                                </td>
                                <td className="py-3 text-right pr-2 font-bold text-slate-700 dark:text-slate-300">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(osItem.total)}
                                </td>
                                <td className="py-3 text-center">
                                  <button 
                                    onClick={() => setOsItems(osItems.filter(i => i.contractItemId !== osItem.contractItemId))}
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateOS}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={20} />
                Emitir Ordem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO / IMPRESSÃO (Documento) */}
      {viewOS && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white text-black w-full max-w-[210mm] h-[90vh] overflow-y-auto rounded-sm shadow-2xl relative flex flex-col">
            {/* Toolbar fixa no topo do modal */}
            <div className="sticky top-0 bg-slate-800 text-white p-4 flex justify-between items-center print:hidden z-10">
              <span className="font-bold flex items-center gap-2"><Printer size={18} /> Visualização de Impressão</span>
              <div className="flex gap-3">
                <button onClick={printOS} className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-bold text-sm">Imprimir / PDF</button>
                <button onClick={() => setViewOS(null)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded font-bold text-sm">Fechar</button>
              </div>
            </div>

            {/* Documento A4 */}
            <div className="p-[15mm] space-y-8 print:p-0 print:space-y-6 flex-1 bg-white text-black">
              {/* Cabeçalho */}
              <div className="flex gap-4 items-center border-b-2 border-black pb-4">
                <div className="w-20 h-20 bg-gray-100 flex items-center justify-center font-bold text-xs text-center p-2 border border-black uppercase">
                  LOGOTIPO
                </div>
                <div className="flex-1 text-center">
                  <h1 className="font-bold text-xl uppercase">{state.entity.name}</h1>
                  <p className="text-sm">{state.entity.secretary}</p>
                  <p className="text-xs mt-1">CNPJ: {state.entity.cnpj}</p>
                  <p className="text-[10px] mt-0.5 text-gray-500">{state.entity.address} - {state.entity.city}/{state.entity.state}</p>
                </div>
                <div className="w-24 text-right">
                  <p className="font-bold text-lg">O.S.</p>
                  <p className="text-xl font-black">{viewOS.number}</p>
                </div>
              </div>

              {/* Título */}
              <div className="text-center py-2 bg-gray-100 border border-black font-bold uppercase tracking-wider">
                Ordem de Serviço / Autorização de Fornecimento
              </div>

              {/* Dados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="border border-black p-3 space-y-1">
                  <p className="font-bold border-b border-gray-300 mb-2 pb-1">DADOS DO CONTRATO</p>
                  <p><span className="font-bold">Contrato Nº:</span> {state.contracts.find(c => c.id === viewOS.contractId)?.number}</p>
                  <p><span className="font-bold">Fornecedor:</span> {state.suppliers.find(s => s.id === state.contracts.find(c => c.id === viewOS.contractId)?.supplierId)?.name}</p>
                  <p><span className="font-bold">CNPJ:</span> {state.suppliers.find(s => s.id === state.contracts.find(c => c.id === viewOS.contractId)?.supplierId)?.cnpj}</p>
                </div>
                <div className="border border-black p-3 space-y-1">
                  <p className="font-bold border-b border-gray-300 mb-2 pb-1">DADOS DA ORDEM</p>
                  <p><span className="font-bold">Data Emissão:</span> {new Date(viewOS.issueDate).toLocaleDateString()}</p>
                  <p><span className="font-bold">Local de Entrega:</span> {state.entity.address}</p>
                  <p><span className="font-bold">Status:</span> EMITIDA</p>
                </div>
              </div>

              <div className="border border-black p-3 text-sm min-h-[80px]">
                <p className="font-bold mb-1">DESCRIÇÃO DA SOLICITAÇÃO:</p>
                <p>{viewOS.description}</p>
              </div>

              {/* Itens */}
              <div className="mt-4">
                <p className="font-bold text-sm mb-2">ITENS AUTORIZADOS:</p>
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 w-10">Item</th>
                      <th className="border border-black p-2 text-left">Descrição</th>
                      <th className="border border-black p-2 w-16">Unid</th>
                      <th className="border border-black p-2 w-20">Qtd</th>
                      <th className="border border-black p-2 w-24">Vl. Unit</th>
                      <th className="border border-black p-2 w-24">Vl. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOS.items.map((item, idx) => {
                      const contractItem = state.contracts.find(c => c.id === viewOS.contractId)?.items.find(i => i.id === item.contractItemId);
                      return (
                        <tr key={idx}>
                          <td className="border border-black p-2 text-center">{idx + 1}</td>
                          <td className="border border-black p-2">{contractItem?.description}</td>
                          <td className="border border-black p-2 text-center">{contractItem?.unit}</td>
                          <td className="border border-black p-2 text-center">{item.quantity}</td>
                          <td className="border border-black p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitPrice)}</td>
                          <td className="border border-black p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={5} className="border border-black p-2 text-right">TOTAL GERAL</td>
                      <td className="border border-black p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getTotalValue(viewOS))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Assinaturas */}
              <div className="grid grid-cols-2 gap-16 mt-20 pt-10 text-center text-sm">
                <div className="border-t border-black pt-2">
                  <p className="font-bold">Gestor do Contrato</p>
                  <p>{state.entity.secretary}</p>
                </div>
                <div className="border-t border-black pt-2">
                  <p className="font-bold">Recebido por (Fornecedor)</p>
                  <p>Data: ____/____/______</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
