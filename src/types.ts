

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
}

export interface Secretariat {
  id: string;
  name: string;
  responsible: string;
  email: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  agency: string;
  account: string;
  description: string;
  secretariat: string; // Link to Secretariat Name or ID
}

export interface Bidding {
  id: string;
  processNumber: string;
  year: string;
  modality: string;
  object: string;
  status: 'open' | 'closed' | 'suspended';
  createdAt: string;
}

export interface ContractItem {
  id: string;
  description: string;
  unit: string;
  originalQty: number;
  unitPrice: number;
  currentBalance: number;
  ataItemId?: string; // Link to original Ata Item
}

export interface Contract {
  id: string;
  number: string;
  supplierId: string;
  biddingId?: string; // Link to Bidding (if direct) or via Ata
  biddingModality?: string; // Display/Fallback
  startDate: string;
  endDate: string;
  globalValue: number;
  items: ContractItem[];
  ataId?: string; 
  secretariatId?: string; // Link to Secretariat ID
  secretariat?: string; // Link to Secretariat Name (Display/Fallback)
}

export interface InvoiceItem {
  id: string;
  serviceOrderItemId?: string; // Link to OS Item
  contractItemId: string;
  quantityUsed: number;
  totalValue: number;
}

export interface Invoice {
  id: string;
  contractId: string;
  serviceOrderId?: string; // Link to Service Order
  number: string;
  issueDate: string;
  items: InvoiceItem[];
  status: 'pending' | 'partial' | 'paid';
  amountPaid: number;
  payments: Payment[];
}

export interface Payment {
  id: string;
  date: string;
  bankAccountId: string;
  amountPaid: number;
}

export interface ServiceOrderItem {
  contractItemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ServiceOrder {
  id: string;
  type: 'service' | 'supply'; // Ordem de Serviço ou Fornecimento
  number: string;
  contractId: string;
  issueDate: string;
  description: string;
  status: 'open' | 'completed' | 'cancelled';
  items: ServiceOrderItem[];
}

export interface EntityConfig {
  name: string;
  secretary: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  ip?: string;
}

// --- NOVOS TIPOS PARA ATAS ---

export interface AtaLote {
  id: string;
  number: number;
  description: string;
  supplierId: string; // Fornecedor do Lote
  subtotal: number;
}

export interface AtaItem {
  id: string;
  loteId?: string; // Link to AtaLote
  loteNumber: number; // Fallback/Display
  itemNumber: number;
  description: string;
  brand: string;
  unit: string;
  quantity: number; // Quantidade Total da Ata
  quantityAvailable: number; // Saldo disponível para contratos
  unitPrice: number;
  totalPrice: number;
}

export interface AtaDistribution {
  id: string;
  secretariatId: string; // Link to Secretariat
  secretariatName: string; // Display name
  percentage: number;
  value: number;
}

export interface Ata {
  id: string;
  biddingId?: string; // Link to Licitação
  processNumber: string; // Fallback or cache
  modality: string; // Fallback
  object: string; // Fallback
  year: string;
  totalValue: number;
  lotes: AtaLote[];
  items: AtaItem[];
  distributions: AtaDistribution[];
  reservedPercentage: number;
  createdAt: string;
}

export type AppState = {
  entity: EntityConfig;
  users: SystemUser[]; 
  logs: SystemLog[];
  suppliers: Supplier[];
  secretariats: Secretariat[]; // New
  biddings: Bidding[]; // New
  accounts: BankAccount[];
  atas: Ata[];
  contracts: Contract[];
  invoices: Invoice[];
  serviceOrders: ServiceOrder[];
};

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
}
