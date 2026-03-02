
import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  FileBadge, 
  Upload, 
  Trash2, 
  Save, 
  X, 
  Building2, 
  PieChart,
  Bot,
  Loader2,
  ChevronDown,
  CheckCircle2,
  Pencil,
  AlertTriangle,
  FileSpreadsheet,
  Gavel,
  Calculator
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';
import { AppState, Ata, AtaItem, AtaDistribution, AtaLote } from '../types';

interface AtasProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

// ... helper functions ...
const attemptJsonRepair = (jsonStr: string): any => {
  if (!jsonStr) return null;
  const clean = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    console.warn("JSON incompleto ou inválido. Tentando reparar...", e);
    try {
        const lastBrace = clean.lastIndexOf('}');
        const fixed = clean.substring(0, lastBrace + 1);
        return JSON.parse(fixed);
    } catch (e2) {
        return null;
    }
  }
};

const Atas: React.FC<AtasProps> = ({ state, setState }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAtaId, setEditingAtaId] = useState<string | null>(null);
  
  // Status de Importação
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState(''); 
  const [warningMsg, setWarningMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Ata>>({
    biddingId: '',
    processNumber: '',
    modality: '',
    object: '',
    year: new Date().getFullYear().toString(),
    items: [],
    distributions: [],
    lotes: [],
    reservedPercentage: 100
  });

  // State para itens e lotes
  const [items, setItems] = useState<AtaItem[]>([]);
  const [lotes, setLotes] = useState<AtaLote[]>([]);
  
  // State para distribuição
  const [distributions, setDistributions] = useState<AtaDistribution[]>([]);
  const [newDistSecretariat, setNewDistSecretariat] = useState('');
  const [newDistPercent, setNewDistPercent] = useState<number>(0);

  const totalValue = useMemo(() => {
    return items.reduce((acc, item) => acc + item.totalPrice, 0);
  }, [items]);

  const filteredAtas = (state.atas || []).filter(a => 
    a.processNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.object.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- AI IMPORT LOGIC OTIMIZADA ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isExcel = file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isPdf && !isExcel) {
      alert('Por favor, envie apenas arquivos PDF ou Excel (.xlsx, .xls).');
      return;
    }

    setIsImporting(true);
    setImportStatus('Lendo arquivo...');
    setWarningMsg('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let prompt = '';
      let parts: any[] = [];

      // PROMPT PADRONIZADO PARA PDF E EXCEL
      const systemInstruction = `
### OBJETIVO PRINCIPAL
Você deve identificar a estrutura de LOTES do documento. O documento pode conter um ou mais lotes (ex: "LOTE 1 - AMPLA", "LOTE 2 - COTA RESERVADA"). Cada lote possui sua própria tabela de itens. É crucial que os itens fiquem agrupados dentro do seu respectivo lote.

### INSTRUÇÕES DE EXTRAÇÃO

1. **METADADOS (CABEÇALHO):**
   - Extraia o Número do Processo, Pregão/Modalidade, Número da Ata e Ano.
   - Extraia os dados do Fornecedor (Razão Social e CNPJ).
   - Extraia o Objeto da licitação (resumo).

2. **ESTRUTURA DE LOTES (CRÍTICO):**
   - Percorra todo o texto procurando por marcadores de início de lote (ex: "LOTE 01", "GRUPO 1", "LOTE I", "COTA RESERVADA").
   - Capture todos os itens pertencentes a esse lote sequencialmente.
   - Importante: A numeração dos itens pode reiniciar em cada lote (ex: Item 1 do Lote 1, Item 1 do Lote 2).

3. **TRATAMENTO DE DADOS:**
   - **Valores Monetários:** Converta para 'float' (ponto flutuante). Ex: "R$ 1.250,00" -> 1250.00.
   - **Quantidades:** Converta para 'number'.
   - **CNPJ:** Remova pontos e traços, mantendo apenas dígitos.
   - **Texto:** Remova quebras de linha desnecessárias dentro das descrições.

### FORMATO DE SAÍDA (JSON SCHEMA OBRIGATÓRIO)
Responda APENAS com um JSON válido seguindo esta estrutura exata:

{
  "cabecalho": {
    "numero_processo": "string",
    "numero_pregao": "string (ex: Pregão Eletrônico 010/2023)",
    "numero_ata": "string",
    "ano_ata": "string",
    "fornecedor": {
      "razao_social": "string",
      "cnpj": "string"
    },
    "objeto_resumido": "string"
  },
  "lotes": [
    {
      "numero_lote": "number",
      "descricao_lote": "string (ex: LOTE 1 - AMPLA PARTICIPAÇÃO)",
      "itens": [
        {
          "item_numero": "number",
          "descricao_detalhada": "string",
          "unidade_medida": "string",
          "marca": "string",
          "quantidade": "number",
          "valor_unitario": "number",
          "valor_total_item": "number"
        }
      ]
    }
  ]
}
      `;

      if (isExcel) {
        setImportStatus('Lendo planilhas...');
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        let allCsvContent = "";
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
            if (csv && csv.trim().length > 0) {
                allCsvContent += `\n--- ABA/PLANILHA: ${sheetName} ---\n${csv}\n`;
            }
        });

        if (!allCsvContent.trim()) throw new Error("Excel vazio ou ilegível.");

        prompt = `
          Analise os dados CSV abaixo extraídos de um Excel.
          Se houver múltiplas abas ou tabelas separadas, trate como LOTES distintos se aplicável.
          
          DADOS CSV:
          ${allCsvContent.substring(0, 400000)} 
        `; 

        parts = [{ text: systemInstruction + "\n\n" + prompt }];

      } else {
        // PDF
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        const base64Data = await base64Promise;
        const base64Content = base64Data.split(',')[1];

        parts = [
          { text: systemInstruction },
          { inlineData: { mimeType: 'application/pdf', data: base64Content } }
        ];
      }

      setImportStatus('IA processando Lotes e Itens...');

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-09-2025', 
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        });

        setImportStatus('Processando resposta...');
        
        let text = response.text;
        if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
             text = response.candidates[0].content.parts[0].text;
        }

        if (!text) throw new Error("A IA não retornou dados.");

        let extractedData = attemptJsonRepair(text);

        if (!extractedData || !extractedData.cabecalho) {
            console.error("JSON Inválido:", text);
            throw new Error("Formato de dados retornado inválido.");
        }

        // --- MAPEAMENTO DOS DADOS ---
        
        // 1. Identificar Fornecedor (Tentativa no cabeçalho, mas agora será por lote preferencialmente)
        // Se a IA retornar fornecedor no cabeçalho, usamos como default para os lotes
        let defaultSupplierId = '';
        const cnpjImp = extractedData.cabecalho.fornecedor?.cnpj?.replace(/\D/g, '') || '';
        const nomeImp = extractedData.cabecalho.fornecedor?.razao_social || '';

        if (cnpjImp) {
            const supplier = state.suppliers.find(s => s.cnpj.replace(/\D/g, '').includes(cnpjImp));
            if (supplier) defaultSupplierId = supplier.id;
        }
        if (!defaultSupplierId && nomeImp) {
            const supplier = state.suppliers.find(s => s.name.toLowerCase().includes(nomeImp.toLowerCase()));
            if (supplier) defaultSupplierId = supplier.id;
        }

        // 2. Preencher Cabeçalho
        setFormData(prev => ({
          ...prev,
          processNumber: extractedData.cabecalho.numero_processo || '',
          modality: extractedData.cabecalho.numero_pregao || '',
          object: extractedData.cabecalho.objeto_resumido || '',
          year: String(extractedData.cabecalho.ano_ata || new Date().getFullYear()),
        }));

        // 3. Processar Lotes e Itens
        const mappedItems: AtaItem[] = [];
        const mappedLotes: AtaLote[] = [];
        
        if (extractedData.lotes && Array.isArray(extractedData.lotes)) {
            extractedData.lotes.forEach((lote: any, indexLote: number) => {
                const loteId = Math.random().toString(36).substr(2, 9);
                const nomeLote = lote.descricao_lote || `Lote ${indexLote + 1}`;
                const numLote = lote.numero_lote || indexLote + 1;
                
                let subtotalLote = 0;

                if (lote.itens && Array.isArray(lote.itens)) {
                    lote.itens.forEach((item: any) => {
                        const totalItem = Number(item.valor_total_item) || (Number(item.quantidade) * Number(item.valor_unitario));
                        subtotalLote += totalItem;

                        mappedItems.push({
                            id: Math.random().toString(36).substr(2, 9),
                            loteId: loteId,
                            loteNumber: numLote,
                            itemNumber: Number(item.item_numero) || 0,
                            description: item.descricao_detalhada || '',
                            brand: item.marca || '',
                            unit: item.unidade_medida || 'UND',
                            quantity: Number(item.quantidade) || 0,
                            quantityAvailable: Number(item.quantidade) || 0,
                            unitPrice: Number(item.valor_unitario) || 0,
                            totalPrice: totalItem
                        });
                    });
                }

                mappedLotes.push({
                    id: loteId,
                    number: numLote,
                    description: nomeLote,
                    supplierId: defaultSupplierId, // Associa o fornecedor do cabeçalho inicialmente
                    subtotal: subtotalLote
                });
            });
        }

        setItems(mappedItems);
        setLotes(mappedLotes);
        
        // Verifica alerta
        if (isPdf && mappedItems.length === 0) {
             setWarningMsg("A IA leu o cabeçalho mas não encontrou itens. Verifique se o PDF é uma imagem escaneada.");
        } else {
             setImportStatus('Concluído!');
             setTimeout(() => setIsImporting(false), 1000);
        }

      } catch (error: any) {
        console.error("Erro na IA:", error);
        alert(`Erro: ${error.message}`);
        setIsImporting(false);
      }

    } catch (err: any) {
      console.error(err);
      setIsImporting(false);
      alert(`Erro crítico: ${err.message}`);
    }
  };

  // --- CRUD ITEM LOGIC ---
  const handleAddItem = () => {
    // Se não houver lotes, cria um padrão
    let targetLoteId = lotes[0]?.id;
    if (!targetLoteId) {
        const newLote: AtaLote = {
            id: Math.random().toString(36).substr(2, 9),
            number: 1,
            description: 'Lote 1',
            supplierId: '',
            subtotal: 0
        };
        setLotes([newLote]);
        targetLoteId = newLote.id;
    }

    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      loteId: targetLoteId,
      loteNumber: 1,
      itemNumber: items.length + 1,
      description: '',
      brand: '',
      unit: 'UND',
      quantity: 0,
      quantityAvailable: 0,
      unitPrice: 0,
      totalPrice: 0
    }]);
  };

  const updateItem = (id: string, field: keyof AtaItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalcular total se mudar qtd ou preço
        if (field === 'quantity' || field === 'unitPrice') {
          updated.totalPrice = updated.quantity * updated.unitPrice;
          if (field === 'quantity') updated.quantityAvailable = updated.quantity;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  // --- DISTRIBUTION LOGIC ---
  const handleAddDistribution = () => {
    if (!newDistSecretariat || newDistPercent <= 0) return;

    const currentDistributed = distributions.reduce((acc, d) => acc + d.percentage, 0);
    const available = 100 - currentDistributed;

    if (newDistPercent > available) {
      alert(`Atenção: Você só tem ${available}% disponível para distribuir.`);
      return;
    }

    const newValue = (totalValue * newDistPercent) / 100;

    // Find secretariat ID if possible, or just use name for now (legacy support)
    const sec = state.secretariats?.find(s => s.name === newDistSecretariat);

    const newDist: AtaDistribution = {
      id: Math.random().toString(36).substr(2, 9),
      secretariatId: sec?.id || '',
      secretariatName: newDistSecretariat,
      percentage: newDistPercent,
      value: newValue
    };

    setDistributions([...distributions, newDist]);
    setNewDistSecretariat('');
    setNewDistPercent(0);
  };

  const removeDistribution = (id: string) => {
    setDistributions(distributions.filter(d => d.id !== id));
  };

  const reservedPercent = 100 - distributions.reduce((acc, d) => acc + d.percentage, 0);
  const reservedValue = (totalValue * reservedPercent) / 100;

  // --- EDIT & SAVE ATA ---
  
  const handleEditAta = (ata: Ata) => {
    setEditingAtaId(ata.id);
    
    setFormData({
      biddingId: ata.biddingId,
      processNumber: ata.processNumber,
      modality: ata.modality,
      object: ata.object,
      year: ata.year
    });

    setItems(ata.items.map(i => ({...i})));
    setLotes(ata.lotes ? ata.lotes.map(l => ({...l})) : []); // Handle legacy atas without lotes
    setDistributions(ata.distributions.map(d => ({...d})));
    
    setIsModalOpen(true);
  };

  const handleSaveAta = () => {
    if (!formData.processNumber || items.length === 0) {
      alert("Preencha o número do processo e adicione itens.");
      return;
    }

    // Validate if all lotes have suppliers
    const missingSupplier = lotes.some(l => !l.supplierId);
    if (missingSupplier) {
        alert("Todos os lotes devem ter um fornecedor vinculado.");
        return;
    }

    // Recalcula o valor das distribuições
    const updatedDistributions = distributions.map(d => ({
      ...d,
      value: (totalValue * d.percentage) / 100
    }));

    // Update lotes subtotals
    const updatedLotes = lotes.map(l => ({
        ...l,
        subtotal: items.filter(i => i.loteId === l.id).reduce((acc, i) => acc + i.totalPrice, 0)
    }));

    const ataData: Ata = {
      id: editingAtaId || Math.random().toString(36).substr(2, 9),
      biddingId: formData.biddingId,
      processNumber: formData.processNumber!,
      modality: formData.modality || '',
      object: formData.object || '',
      year: formData.year || new Date().getFullYear().toString(),
      totalValue: totalValue,
      lotes: updatedLotes,
      items: items,
      distributions: updatedDistributions,
      reservedPercentage: reservedPercent,
      createdAt: editingAtaId 
        ? (state.atas.find(a => a.id === editingAtaId)?.createdAt || new Date().toISOString()) 
        : new Date().toISOString()
    };

    if (editingAtaId) {
      setState(prev => ({
        ...prev,
        atas: prev.atas.map(a => a.id === editingAtaId ? ataData : a)
      }));
    } else {
      setState(prev => ({
        ...prev,
        atas: [...(prev.atas || []), ataData]
      }));
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteAta = (id: string) => {
    if (confirm("Deseja realmente excluir esta Ata?")) {
      setState(prev => ({
        ...prev,
        atas: prev.atas.filter(a => a.id !== id)
      }));
    }
  };

  const resetForm = () => {
    setEditingAtaId(null);
    setFormData({ year: new Date().getFullYear().toString(), processNumber: '', modality: '', object: '', biddingId: '' });
    setItems([]);
    setLotes([]);
    setDistributions([]);
    setWarningMsg('');
  };

  // Handle Bidding Selection
  const handleBiddingSelect = (biddingId: string) => {
      const bidding = state.biddings?.find(b => b.id === biddingId);
      if (bidding) {
          setFormData(prev => ({
              ...prev,
              biddingId: bidding.id,
              processNumber: bidding.processNumber,
              modality: bidding.modality,
              object: bidding.object,
              year: bidding.year
          }));
      }
  };

  // Update Lote Supplier
  const updateLoteSupplier = (loteId: string, supplierId: string) => {
      setLotes(prev => prev.map(l => l.id === loteId ? { ...l, supplierId } : l));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            ATAS / Registro de Preço
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gestão de Atas e Distribuição de Saldo.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
        >
          <Plus size={20} />
          Nova Ata
        </button>
      </div>

      {/* Lista de Atas */}
      <div className="grid grid-cols-1 gap-4">
        {/* Filtro */}
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

        {filteredAtas.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <FileBadge size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma Ata Registrada.</p>
          </div>
        ) : (
          filteredAtas.map(ata => {
            return (
              <div key={ata.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <FileBadge size={20} className="text-blue-500" />
                      Processo: {ata.processNumber}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{ata.modality}</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-2xl">{ata.object}</p>
                    
                    {/* Exibir Lotes/Fornecedores */}
                    <div className="mt-4 space-y-1">
                        {ata.lotes?.map(lote => {
                            const sup = state.suppliers.find(s => s.id === lote.supplierId);
                            return (
                                <div key={lote.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                    <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Lote {lote.number}</span>
                                    <span className="flex items-center gap-1"><Building2 size={12}/> {sup?.name || 'Sem fornecedor'}</span>
                                    <span className="text-slate-400">({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lote.subtotal)})</span>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total da Ata</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-white mb-4">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ata.totalValue)}
                    </p>
                    
                    <div className="flex justify-end gap-2">
                      <div className="text-right px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                        <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Distribuído</p>
                        <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{100 - ata.reservedPercentage}%</p>
                      </div>
                      <div className="text-right px-3 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                        <p className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase">Reserva</p>
                        <p className="font-bold text-orange-700 dark:text-orange-300 text-sm">{ata.reservedPercentage}%</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-4">
                      <button 
                        onClick={() => handleEditAta(ata)}
                        className="text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Pencil size={14} /> Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteAta(ata.id)}
                        className="text-red-400 hover:text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  {editingAtaId ? 'Editar Ata de Registro' : 'Cadastro de Ata de Registro de Preços'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingAtaId ? 'Altere itens e distribuição conforme necessário.' : 'Preencha manualmente ou utilize a IA para importar PDF ou Excel.'}
                </p>
              </div>
              <div className="flex gap-2">
                {!editingAtaId && (
                  <>
                    <input 
                      type="file" 
                      accept="application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-80 ${isImporting ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                      {isImporting ? <Loader2 className="animate-spin" size={16} /> : <FileSpreadsheet size={16} />}
                      {isImporting ? importStatus : 'Importar PDF ou Excel (IA)'}
                    </button>
                  </>
                )}
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Conteúdo Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              
              {/* Aviso de Leitura Parcial */}
              {warningMsg && (
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 p-4 rounded-xl flex items-center gap-3 text-orange-700 dark:text-orange-400">
                  <AlertTriangle size={20} />
                  <p className="text-sm font-bold">{warningMsg}</p>
                </div>
              )}

              {/* Seção 1: Dados Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Vincular Licitação</label>
                    <div className="relative">
                        <Gavel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <select 
                            className="w-full pl-10 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                            value={formData.biddingId || ''}
                            onChange={(e) => handleBiddingSelect(e.target.value)}
                        >
                            <option value="">Selecione uma Licitação...</option>
                            {state.biddings?.map(b => (
                                <option key={b.id} value={b.id}>{b.processNumber} - {b.object.substring(0, 50)}...</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="md:col-span-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Processo Nº</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold outline-none text-slate-600 dark:text-slate-300"
                    value={formData.processNumber}
                    readOnly
                  />
                </div>
                <div className="md:col-span-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Ano</label>
                  <input 
                    type="text" 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold outline-none text-slate-600 dark:text-slate-300"
                    value={formData.year}
                    readOnly
                  />
                </div>
                
                <div className="md:col-span-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Objeto</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium outline-none text-slate-600 dark:text-slate-300 resize-none h-20"
                    value={formData.object}
                    readOnly
                  />
                </div>
              </div>

              {/* Seção 2: Lotes e Fornecedores */}
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        Lotes e Fornecedores
                    </h4>
                    <button 
                        onClick={() => {
                            const nextNum = lotes.length + 1;
                            setLotes([...lotes, {
                                id: Math.random().toString(36).substr(2, 9),
                                number: nextNum,
                                description: `Lote ${nextNum}`,
                                supplierId: '',
                                subtotal: 0
                            }]);
                        }}
                        className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1"
                    >
                        <Plus size={14} /> Adicionar Lote
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lotes.map(lote => (
                          <div key={lote.id} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold text-slate-700 dark:text-white">Lote {lote.number}</span>
                                  <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
                                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lote.subtotal)}
                                      </span>
                                      <button 
                                          onClick={() => {
                                              if (confirm("Excluir este lote e todos os seus itens?")) {
                                                  setLotes(lotes.filter(l => l.id !== lote.id));
                                                  setItems(items.filter(i => i.loteId !== lote.id));
                                              }
                                          }}
                                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                          title="Excluir Lote"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </div>
                              </div>
                              <p className="text-xs text-slate-500 mb-3">{lote.description}</p>
                              <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-400">Fornecedor do Lote</label>
                                  <select 
                                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                      value={lote.supplierId}
                                      onChange={(e) => updateLoteSupplier(lote.id, e.target.value)}
                                  >
                                      <option value="">Selecione...</option>
                                      {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                              </div>
                          </div>
                      ))}
                      {lotes.length === 0 && (
                          <div className="col-span-full text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              Nenhum lote identificado. Adicione itens para criar lotes.
                          </div>
                      )}
                  </div>
              </div>

              {/* Seção 3: Itens */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    Itens da Ata
                    {items.length > 0 && <span className="bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full">{items.length} itens</span>}
                  </h4>
                  <button onClick={handleAddItem} className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-bold transition-colors">
                    + Adicionar Item
                  </button>
                </div>
                
                <div className="overflow-x-auto max-h-[400px] custom-scrollbar rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm text-left relative">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 w-16 text-center bg-slate-50 dark:bg-slate-950">Item</th>
                        <th className="p-3 w-24 text-center bg-slate-50 dark:bg-slate-950">Lote</th>
                        <th className="p-3 bg-slate-50 dark:bg-slate-950">Descrição</th>
                        <th className="p-3 w-32 bg-slate-50 dark:bg-slate-950">Marca</th>
                        <th className="p-3 w-20 text-center bg-slate-50 dark:bg-slate-950">Und</th>
                        <th className="p-3 w-24 text-center bg-slate-50 dark:bg-slate-950">Qtd</th>
                        <th className="p-3 w-32 text-right bg-slate-50 dark:bg-slate-950">Unitário</th>
                        <th className="p-3 w-32 text-right bg-slate-50 dark:bg-slate-950">Total</th>
                        <th className="p-3 w-10 bg-slate-50 dark:bg-slate-950"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2 text-center font-bold text-slate-400">{item.itemNumber || index + 1}</td>
                          <td className="p-2">
                              <select 
                                  className="w-full bg-transparent outline-none text-center font-medium text-blue-600 dark:text-blue-400"
                                  value={item.loteId || ''}
                                  onChange={e => {
                                      const lote = lotes.find(l => l.id === e.target.value);
                                      updateItem(item.id, 'loteId', e.target.value);
                                      if (lote) updateItem(item.id, 'loteNumber', lote.number);
                                  }}
                              >
                                  {lotes.map(l => <option key={l.id} value={l.id}>{l.number}</option>)}
                              </select>
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="w-full bg-transparent outline-none font-medium text-slate-700 dark:text-slate-200"
                              value={item.description}
                              onChange={e => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Descrição do item"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="w-full bg-transparent outline-none text-slate-600 dark:text-slate-400"
                              value={item.brand}
                              onChange={e => updateItem(item.id, 'brand', e.target.value)}
                              placeholder="Marca"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="w-full bg-transparent outline-none text-center font-bold text-slate-500 uppercase"
                              value={item.unit}
                              onChange={e => updateItem(item.id, 'unit', e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded p-1 outline-none text-center font-bold"
                              value={item.quantity}
                              onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded p-1 outline-none text-right font-bold"
                              value={item.unitPrice}
                              onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                            />
                          </td>
                          <td className="p-2 text-right font-black text-slate-700 dark:text-slate-300">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}
                          </td>
                          <td className="p-2 text-center">
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-950 font-bold sticky bottom-0 z-10 shadow-inner">
                      <tr>
                        <td colSpan={7} className="p-3 text-right text-slate-500 uppercase text-xs tracking-widest bg-slate-50 dark:bg-slate-950">Total Geral da Ata</td>
                        <td className="p-3 text-right text-slate-800 dark:text-white text-lg bg-slate-50 dark:bg-slate-950">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </td>
                        <td className="bg-slate-50 dark:bg-slate-950"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Seção 4: Distribuição Financeira (O 50%) */}
              <div className="bg-slate-50/50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                    <PieChart size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">Distribuição Orçamentária</h4>
                    <p className="text-xs text-slate-500">Defina a porcentagem da Ata destinada a cada secretaria.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Form de Adicionar */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Secretaria</label>
                      <select 
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                        value={newDistSecretariat}
                        onChange={e => setNewDistSecretariat(e.target.value)}
                      >
                          <option value="">Selecione...</option>
                          {state.secretariats?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Porcentagem (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold"
                          value={newDistPercent}
                          onChange={e => setNewDistPercent(Number(e.target.value))}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleAddDistribution}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white p-3 rounded-xl font-bold transition-colors"
                    >
                      Adicionar Distribuição
                    </button>
                  </div>

                  {/* Lista e Gráfico */}
                  <div className="md:col-span-2 space-y-4">
                    {distributions.map(dist => (
                      <div key={dist.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-white">{dist.secretariatName}</p>
                          <p className="text-xs text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dist.value)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-lg text-blue-600 dark:text-blue-400">{dist.percentage}%</span>
                          <button onClick={() => removeDistribution(dist.id)} className="text-slate-300 hover:text-red-500">
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-slate-400">Reserva Técnica (Não Distribuído)</span>
                      <span className="font-black text-lg text-orange-500">{reservedPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                <button onClick={handleSaveAta} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 dark:shadow-blue-900/20 transition-colors">
                  Salvar Ata
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Atas;
