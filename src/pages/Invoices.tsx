import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  X,
  Package,
  FileCheck,
  Calculator,
  AlertTriangle,
  Pencil,
  FileText
} from 'lucide-react';
import { AppState, Invoice, InvoiceItem } from '../types';

interface InvoicesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Invoices: React.FC<InvoicesProps> = ({ state, setState }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [selectedOsId, setSelectedOsId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Chave é o contractItemId (que vem da OS), Valor é a quantidade
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

  const selectedOs = useMemo(() => 
    state.serviceOrders.find(os => os.id === selectedOsId), 
    [selectedOsId, state.serviceOrders]
  );

  const selectedContract = useMemo(() => 
    selectedOs ? state.contracts.find(c => c.id === selectedOs.contractId) : null,
    [selectedOs, state.contracts]
  );

  const totalInvoiceValue = useMemo(() => {
    if (!selectedOs) return 0;
    return selectedOs.items.reduce((acc, item) => {
      const qty = quantities[item.contractItemId] || 0;
      return acc + (qty * item.unitPrice);
    }, 0);
  }, [selectedOs, quantities]);

  const handleQuantityChange = (itemId: string, value: string) => {
    const osItem = selectedOs?.items.find(i => i.contractItemId === itemId);
    const contractItem = selectedContract?.items.find(i => i.id === itemId);
    if (!osItem || !contractItem) return;

    let newQty = parseFloat(value);
    
    if (newQty < 0 || isNaN(newQty)) newQty = 0;

    // Validação: Não pode exceder a quantidade da OS
    if (newQty > osItem.quantity) {
      setError(`Atenção: A quantidade não pode exceder o autorizado na OS (${osItem.quantity} ${contractItem.unit}).`);
      newQty = osItem.quantity;
    } else {
      setError('');
    }

    setQuantities(prev => ({ ...prev, [itemId]: newQty }));
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoiceId(invoice.id);
    setSelectedOsId(invoice.serviceOrderId || '');
    setInvoiceNumber(invoice.number);
    setIssueDate(invoice.issueDate);

    const initialQuantities: Record<string, number> = {};
    invoice.items.forEach(item => {
      initialQuantities[item.contractItemId] = item.quantityUsed;
    });
    setQuantities(initialQuantities);
    
    setIsModalOpen(true);
  };

  const handleSaveInvoice = () => {
    if (!selectedOsId || !invoiceNumber || !issueDate) {
      setError('Por favor, preencha os dados básicos da Nota Fiscal.');
      return;
    }

    const itemsToSave: InvoiceItem[] = [];
    
    selectedOs?.items.forEach(item => {
      const qty = quantities[item.contractItemId] || 0;
      if (qty > 0) {
        itemsToSave.push({
          id: Math.random().toString(36).substr(2, 9),
          contractItemId: item.contractItemId,
          serviceOrderItemId: item.contractItemId, // Using contractItemId as link for now, ideally OS item needs ID
          quantityUsed: qty,
          totalValue: qty * item.unitPrice
        });
      }
    });

    if (itemsToSave.length === 0) {
      setError('A Nota Fiscal deve conter pelo menos um item.');
      return;
    }

    setState(prev => {
      // 1. Update OS Status
      const updatedServiceOrders = prev.serviceOrders.map(os => {
          if (os.id === selectedOsId) {
              // Check if fully invoiced? For now, mark completed if invoiced.
              return { ...os, status: 'completed' as const };
          }
          return os;
      });

      // 2. Create/Update Invoice
      const newInvoiceData: Invoice = {
        id: editingInvoiceId || Math.random().toString(36).substr(2, 9),
        contractId: selectedOs!.contractId,
        serviceOrderId: selectedOsId,
        number: invoiceNumber,
        issueDate,
        status: 'pending',
        amountPaid: 0,
        payments: [],
        items: itemsToSave
      };

      let updatedInvoices = prev.invoices;
      if (editingInvoiceId) {
        // Preserve existing payments if editing (though usually editing paid invoices is blocked)
        const existing = prev.invoices.find(i => i.id === editingInvoiceId);
        if (existing) {
            newInvoiceData.status = existing.status;
            newInvoiceData.amountPaid = existing.amountPaid;
            newInvoiceData.payments = existing.payments;
        }
        updatedInvoices = prev.invoices.map(inv => inv.id === editingInvoiceId ? newInvoiceData : inv);
      } else {
        updatedInvoices = [...prev.invoices, newInvoiceData];
      }

      return {
        ...prev,
        serviceOrders: updatedServiceOrders,
        invoices: updatedInvoices
      };
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteInvoice = (id: string) => {
    const invoice = state.invoices.find(i => i.id === id);
    if (!invoice) return;

    if (invoice.status !== 'pending') {
      alert("Não é possível excluir uma nota fiscal que já foi paga ou parcialmente paga.");
      return;
    }

    if (confirm(`Deseja realmente excluir a NF ${invoice.number}? A Ordem de Serviço será reaberta.`)) {
      setState(prev => {
        // Reopen OS
        const updatedServiceOrders = prev.serviceOrders.map(os => {
            if (os.id === invoice.serviceOrderId) {
                return { ...os, status: 'open' as const };
            }
            return os;
        });

        return {
          ...prev,
          serviceOrders: updatedServiceOrders,
          invoices: prev.invoices.filter(i => i.id !== id)
        };
      });
    }
  };

  const resetForm = () => {
    setEditingInvoiceId(null);
    setSelectedOsId('');
    setInvoiceNumber('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setQuantities({});
    setError('');
  };

  // Auto-fill quantities when OS is selected
  useMemo(() => {
      if (selectedOs && !editingInvoiceId) {
          const initial: Record<string, number> = {};
          selectedOs.items.forEach(i => {
              initial[i.contractItemId] = i.quantity;
          });
          setQuantities(initial);
      }
  }, [selectedOs, editingInvoiceId]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Notas Fiscais / Despesas</h2>
          <p className="text-slate-500 dark:text-slate-400">Lançamento e baixa de itens via Ordem de Serviço.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30 active:scale-95"
        >
          <Plus size={20} />
          Lançar Nota Fiscal
        </button>
      </div>

      {/* Lista de Notas Fiscais */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nota Fiscal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">O.S. Vinculada</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase text-right">Valor Total</th>
                <th className="px-6 py-4 w-28 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.invoices.map(inv => {
                const os = state.serviceOrders.find(o => o.id === inv.serviceOrderId);
                const total = inv.items.reduce((acc, i) => acc + i.totalValue, 0);
                return (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">NF {inv.number}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {os ? `OS ${os.number}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-center">{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${inv.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : inv.status === 'partial' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                        {inv.status === 'paid' ? 'Paga' : inv.status === 'partial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800 dark:text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status !== 'paid' && (
                          <button 
                            onClick={() => handleEditInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className={`p-2 rounded-lg transition-colors ${inv.status !== 'pending' ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                          disabled={inv.status !== 'pending'}
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {state.invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-600">Nenhuma nota fiscal lançada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-white/20 dark:border-slate-800">
            
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <FileCheck size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">{editingInvoiceId ? 'Edição de Lançamento' : 'Controle de Despesas'}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{editingInvoiceId ? 'Editar Nota Fiscal' : 'Lançamento de Nota Fiscal'}</h3>
              </div>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Ordem de Serviço *</label>
                  <select 
                    className={`w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${editingInvoiceId ? 'opacity-60 cursor-not-allowed' : ''}`}
                    value={selectedOsId}
                    onChange={(e) => {
                      if (!editingInvoiceId) {
                        setSelectedOsId(e.target.value);
                        setQuantities({}); 
                        setError('');
                      }
                    }}
                    disabled={!!editingInvoiceId}
                  >
                    <option value="">Selecione a OS...</option>
                    {state.serviceOrders.filter(os => os.status === 'open' || os.id === editingInvoiceId || (editingInvoiceId && os.id === state.invoices.find(i => i.id === editingInvoiceId)?.serviceOrderId)).map(os => {
                        const contract = state.contracts.find(c => c.id === os.contractId);
                        const supplier = state.suppliers.find(s => s.id === contract?.supplierId);
                        return (
                            <option key={os.id} value={os.id}>OS {os.number} - {supplier?.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(os.items.reduce((a, b) => a + b.total, 0))})</option>
                        );
                    })}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Número da Nota *</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 12345" 
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase ml-1 tracking-widest">Data de Emissão *</label>
                  <input 
                    type="date" 
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
                  <AlertCircle size={24} className="shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}

              {selectedOs && selectedContract ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <Package size={20} className="text-blue-600 dark:text-blue-400" />
                    <h4 className="font-black text-slate-700 dark:text-slate-200 text-sm uppercase tracking-widest">Itens da Ordem de Serviço</h4>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-900 text-left border-b border-slate-200 dark:border-slate-800">
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-16 text-center">#</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Descrição</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-24 text-center">Und</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-right">R$ Unit.</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-center bg-blue-50 dark:bg-blue-900/10">Qtd. OS</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-center bg-emerald-50 dark:bg-emerald-900/10">Qtd. NF</th>
                          <th className="p-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest w-32 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {selectedOs.items.map((osItem, idx) => {
                          const contractItem = selectedContract.items.find(i => i.id === osItem.contractItemId);
                          const qty = quantities[osItem.contractItemId] || 0;
                          const subtotal = qty * osItem.unitPrice;
                          
                          return (
                            <tr key={idx} className={`transition-colors ${qty > 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-white dark:hover:bg-slate-900'}`}>
                              <td className="p-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                              <td className="p-4 font-medium text-slate-700 dark:text-slate-300 text-sm">
                                {contractItem?.description}
                              </td>
                              <td className="p-4 text-center text-xs font-bold text-slate-500">{contractItem?.unit}</td>
                              <td className="p-4 text-right text-sm font-medium text-slate-600 dark:text-slate-400">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(osItem.unitPrice)}
                              </td>
                              
                              <td className="p-4 text-center bg-blue-50/30 dark:bg-blue-900/5">
                                <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                                  {osItem.quantity}
                                </span>
                              </td>

                              <td className="p-2 bg-emerald-50/30 dark:bg-emerald-900/5">
                                <input 
                                  type="number"
                                  min="0"
                                  max={osItem.quantity}
                                  className="w-full p-2 text-center rounded-lg border outline-none font-bold transition-all border-emerald-500 ring-2 ring-emerald-500/20 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400"
                                  value={qty === 0 ? '' : qty}
                                  placeholder="0"
                                  onChange={(e) => handleQuantityChange(osItem.contractItemId, e.target.value)}
                                />
                              </td>

                              <td className="p-4 text-right">
                                <span className={`font-bold text-sm ${qty > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                  <AlertTriangle size={48} className="mb-4 opacity-20" />
                  <p className="font-bold">Aguardando Seleção de O.S.</p>
                  <p className="text-sm">Selecione uma Ordem de Serviço acima.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                  <Calculator size={24} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total da Nota Fiscal</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvoiceValue)}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="flex-1 md:flex-none px-8 py-4 rounded-xl font-bold text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveInvoice}
                  disabled={totalInvoiceValue <= 0}
                  className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white px-10 py-4 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileCheck size={20} />
                  {editingInvoiceId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
