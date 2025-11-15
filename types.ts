export enum TransactionType {
  ENTRADA = 'Entrada',
  SAIDA = 'Saída',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  account: string;
  category: string;
  costCenter?: string;
  notes?: string;
  person?: string;
}

export interface Account {
  id: string;
  name: string;
  initialBalance: number;
}

export interface Category {
  id: string;
  name: string;
  type?: 'Entrada' | 'Saída'; // Se omitido, serve para ambos
}

export interface CostCenter {
  id: string;
  name: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

// --- NOVOS TIPOS ---

export enum CardBrand {
  VISA = 'Visa',
  MASTERCARD = 'Mastercard',
  ELO = 'Elo',
  AMEX = 'American Express',
  OUTRA = 'Outra',
}

export enum Bank {
  ITAU = 'Itaú',
  BRADESCO = 'Bradesco',
  SANTANDER = 'Santander',
  NUBANK = 'Nubank',
  INTER = 'Banco Inter',
  CAIXA = 'Caixa',
  BB = 'Banco do Brasil',
  OUTRO = 'Outro',
}

export interface Person {
    id: string;
    name: string;
}

export interface CreditCard {
    id: string;
    name: string;
    bank: Bank;
    brand: CardBrand;
    last4Digits: string;
    limit: number;
    closingDay: number;
    dueDate: number;
    color: string;
    accountId: string; // Vínculo com a conta para débito
}

export interface CreditCardTransaction {
    id: string;
    cardId: string;
    description: string;
    amount: number;
    date: string;
    personId?: string;
    category: string;
    notes?: string;
    paid: boolean;
    // Campos para parcelamento
    groupId?: string;
    installmentInfo?: {
        current: number;
        total: number;
    };
}

// --- NOVOS TIPOS PARA RECORRÊNCIA E PATRIMÔNIO ---

export enum RecurringTransactionFrequency {
    MENSAL = 'Mensal',
    ANUAL = 'Anual',
}

export interface RecurringTransaction {
    id: string;
    type: TransactionType;
    description: string;
    amount: number;
    account: string;
    category: string;
    frequency: RecurringTransactionFrequency;
    dayOfMonth: number; // Dia do mês para o lançamento
    startDate: string;
    nextDueDate: string;
}

export enum InvestmentType {
    ACOES = 'Ações',
    FUNDOS_IMOBILIARIOS = 'Fundos Imobiliários (FII)',
    RENDA_FIXA = 'Renda Fixa',
    CRIPTOMOEDAS = 'Criptomoedas',
    OUTROS = 'Outros',
}

export interface Investment {
    id: string;
    name: string;
    type: InvestmentType;
    quantity: number;
    unitPrice: number; // Preço de aquisição
    currentValue: number; // Valor atual total
    acquisitionDate: string;
}

export interface Debt {
    id: string;
    name: string;
    totalAmount: number; // Valor total (principal + juros)
    numberOfInstallments: number;
    paidInstallments: number; // Quantidade de parcelas já pagas
    firstDueDate: string; // Data de vencimento da primeira parcela (AAAA-MM-DD)
    accountId: string; // ID da conta para débito das parcelas
}
