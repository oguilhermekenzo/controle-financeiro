

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, Account, Category, CostCenter, Goal, Person, CreditCard, CreditCardTransaction, CardBrand, Bank, RecurringTransaction, RecurringTransactionFrequency, Investment, InvestmentType, Debt, ParsedTransaction } from './types';
import Icon from './components/icons/Icon';
import AddTransactionModal from './components/AddTransactionModal';
import AddCardModal from './components/AddCardModal';
import AddCardTransactionModal from './components/AddCardTransactionModal';
import SmartAnalysis from './components/SmartAnalysis';
import ConfirmationModal from './components/ConfirmationModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CardBrandLogo from './components/icons/CardBrandLogo';
import GoalModal from './components/GoalModal';
import AddValueModal from './components/AddValueModal';
import BankLogo from './components/icons/BankLogo';
import RecurringTransactionModal from './components/RecurringTransactionModal';
import InvestmentModal from './components/InvestmentModal';
import DebtModal from './components/DebtModal';
import ImportStatementModal from './components/ImportStatementModal';
import CustomDatePicker from './components/CustomDatePicker';
import TransferModal from './components/TransferModal';


// Mock Data
const initialAccounts: Account[] = [
  { id: '1', name: 'Carteira', initialBalance: 150.75 },
  { id: '2', name: 'Banco Principal', initialBalance: 3500.00 },
];
const initialCategories: Category[] = [
  { id: '1', name: 'Alimentação' }, { id: '2', name: 'Transporte' }, { id: '3', name: 'Moradia' },
  { id: '4', name: 'Lazer' }, { id: '5', name: 'Salário' }, { id: '6', name: 'Outros' }, { id: '7', name: 'Assinaturas' }, {id: '8', name: 'Pagamento de Fatura'}, {id: '9', name: 'Aporte em Meta'}, { id: '10', name: 'Importado' }, { id: '11', name: 'Pagamento de Empréstimo' }, { id: '12', name: 'Transferência' }
];
const initialCostCenters: CostCenter[] = [
  { id: '1', name: 'Projeto X' }, { id: '2', name: 'Viagem de Férias' },
];
const initialGoals: Goal[] = [
    {id: '1', name: 'Viagem para a Europa', currentAmount: 2500, targetAmount: 10000},
    {id: '2', name: 'Novo Notebook', currentAmount: 800, targetAmount: 6000},
];
const initialTransactions: Transaction[] = [
  { id: '1', type: TransactionType.ENTRADA, description: 'Salário', amount: 5000, date: '2024-07-01', account: 'Banco Principal', category: 'Salário' },
  { id: '2', type: TransactionType.SAIDA, description: 'Aluguel', amount: 1500, date: '2024-07-05', account: 'Banco Principal', category: 'Moradia' },
  { id: '3', type: TransactionType.SAIDA, description: 'Supermercado', amount: 450.50, date: '2024-07-10', account: 'Banco Principal', category: 'Alimentação' },
  { id: '4', type: TransactionType.SAIDA, description: 'Uber', amount: 45.00, date: '2024-07-12', account: 'Carteira', category: 'Transporte', costCenter: 'Projeto X' },
  { id: '5', type: TransactionType.SAIDA, description: 'Cinema', amount: 60.00, date: '2024-06-20', account: 'Banco Principal', category: 'Lazer' },
];
const initialPeople: Person[] = [ { id: '1', name: 'Eu' }, { id: '2', name: 'Cônjuge' } ];
const initialCreditCards: CreditCard[] = [
    { id: 'cc1', name: 'Click Platinum', bank: Bank.ITAU, brand: CardBrand.MASTERCARD, last4Digits: '1234', limit: 5000, closingDay: 20, dueDate: 28, color: 'from-orange-500 to-amber-500', accountId: '2' },
    { id: 'cc2', name: 'Ultravioleta', bank: Bank.NUBANK, brand: CardBrand.MASTERCARD, last4Digits: '5678', limit: 10000, closingDay: 5, dueDate: 15, color: 'from-purple-600 to-indigo-600', accountId: '2' },
];
const initialCreditCardTransactions: CreditCardTransaction[] = [
    { id: 'cct1', cardId: 'cc1', description: 'Restaurante Sofisticado', amount: 150.00, date: '2024-07-18', category: 'Alimentação', personId: '1', paid: false },
    { id: 'cct2', cardId: 'cc2', description: 'Assinatura Netflix', amount: 39.90, date: '2024-07-10', category: 'Assinaturas', personId: '1', paid: false },
    { id: 'cct3', cardId: 'cc1', description: 'Gasolina', amount: 200.00, date: '2024-06-22', category: 'Transporte', personId: '1', paid: true },
    { id: 'cct4', cardId: 'cc1', description: 'Cinema', amount: 55.00, date: '2024-07-20', category: 'Lazer', personId: '2', paid: false },
];
const initialRecurringTransactions: RecurringTransaction[] = [
    { id: 'rt1', type: TransactionType.SAIDA, description: 'Aluguel', amount: 1500, account: 'Banco Principal', category: 'Moradia', frequency: RecurringTransactionFrequency.MENSAL, dayOfMonth: 5, startDate: '2024-01-05', nextDueDate: '2024-08-05' },
    { id: 'rt2', type: TransactionType.ENTRADA, description: 'Salário', amount: 5000, account: 'Banco Principal', category: 'Salário', frequency: RecurringTransactionFrequency.MENSAL, dayOfMonth: 1, startDate: '2024-01-01', nextDueDate: '2024-08-01' },
];
const initialInvestments: Investment[] = [
    { id: 'inv1', name: 'ITSA4', type: InvestmentType.ACOES, quantity: 100, unitPrice: 10.50, currentValue: 1100.00, acquisitionDate: '2023-05-10' },
    { id: 'inv2', name: 'Tesouro Selic 2029', type: InvestmentType.RENDA_FIXA, quantity: 1, unitPrice: 5000, currentValue: 5250.00, acquisitionDate: '2023-01-15' },
];
const initialDebts: Debt[] = [
    { id: 'debt1', name: 'Financiamento Carro', totalAmount: 45000, numberOfInstallments: 36, paidInstallments: 12, firstDueDate: '2023-08-10', accountId: '2' },
];


type View = 'dashboard' | 'transactions' | 'goals' | 'analysis' | 'cards' | 'people' | 'accounts' | 'patrimonio';
type DeletionTarget = { id: string; type: 'transaction' | 'cardTransaction' | 'card' | 'person' | 'goal' | 'account' | 'recurringTransaction' | 'investment' | 'debt'; } | null;
type EditingTarget = { data: any; type: 'transaction' | 'cardTransaction' | 'card' | 'person' | 'goal' | 'account' | 'recurringTransaction' | 'investment' | 'debt'; } | null;


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // State for Modals
  const [isTxModalOpen, setTxModalOpen] = useState(false);
  const [isAddCardModalOpen, setAddCardModalOpen] = useState(false);
  const [isAddCardTxModalOpen, setAddCardTxModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [isAddValueModalOpen, setAddValueModalOpen] = useState(false);
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [isRecurringTxModalOpen, setRecurringTxModalOpen] = useState(false);
  const [isInvestmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [isDebtModalOpen, setDebtModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);

  const [confirmationProps, setConfirmationProps] = useState({ onConfirm: () => {}, title: '', message: '', confirmText: 'Confirmar', confirmButtonClass: '' });
  
  // State for data
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [categories] = useState<Category[]>(initialCategories);
  const [costCenters] = useState<CostCenter[]>(initialCostCenters);
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards);
  const [creditCardTransactions, setCreditCardTransactions] = useState<CreditCardTransaction[]>(initialCreditCardTransactions);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(initialRecurringTransactions);
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [debts, setDebts] = useState<Debt[]>(initialDebts);


  // State for actions
  const [cardTxModalDefaultId, setCardTxModalDefaultId] = useState<string>();
  const [deletionTarget, setDeletionTarget] = useState<DeletionTarget>(null);
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [areValuesVisible, setAreValuesVisible] = useState(true);
  const [summaryPeriod, setSummaryPeriod] = useState<'monthly' | 'overall'>('monthly');
  const [targetGoal, setTargetGoal] = useState<Goal | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [expectationDate, setExpectationDate] = useState<string | null>(null);
  const [transactionsSubView, setTransactionsSubView] = useState<'current' | 'recurring'>('current');
  const [patrimonioSubView, setPatrimonioSubView] = useState<'investments' | 'debts'>('investments');

  
  const availableTransactionMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      months.add(`${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).map(m => new Date(m + '-02T12:00:00')).sort((a, b) => b.getTime() - a.getTime());
  }, [transactions]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const currentMonth = availableTransactionMonths[currentMonthIndex] || new Date();
  
  const goToPreviousMonth = () => setCurrentMonthIndex(prev => Math.min(prev + 1, availableTransactionMonths.length - 1));
  const goToNextMonth = () => setCurrentMonthIndex(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newTransactions: Omit<Transaction, 'id'>[] = [];
    
    const updatedRecurring = recurringTransactions.map(rt => {
        let nextDueDate = new Date(rt.nextDueDate + 'T12:00:00');
        let recurringTransactionUpdated = { ...rt };
        
        while (nextDueDate <= today) {
            newTransactions.push({
                type: rt.type,
                description: `(Recorrente) ${rt.description}`,
                amount: rt.amount,
                date: nextDueDate.toISOString().split('T')[0],
                account: rt.account,
                category: rt.category,
            });

            const newNextDueDate = new Date(nextDueDate);
            if (rt.frequency === RecurringTransactionFrequency.MENSAL) {
                newNextDueDate.setMonth(newNextDueDate.getMonth() + 1);
            } else if (rt.frequency === RecurringTransactionFrequency.ANUAL) {
                newNextDueDate.setFullYear(newNextDueDate.getFullYear() + 1);
            }
            
            nextDueDate = newNextDueDate;
            recurringTransactionUpdated.nextDueDate = newNextDueDate.toISOString().split('T')[0];
        }
        return recurringTransactionUpdated;
    });

    if (newTransactions.length > 0) {
        setTransactions(prev => [...prev, ...newTransactions.map(t => ({...t, id: crypto.randomUUID()}))].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setRecurringTransactions(updatedRecurring);
    }
  }, []);

  const formatCurrency = (value: number) => {
    if (areValuesVisible) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return 'R$ ****,**';
  };

  const previousMonthBalance = useMemo(() => {
    if (availableTransactionMonths.length === 0) {
      return accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
    }
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
    const historicalBalanceChange = transactions
      .filter(t => new Date(t.date + 'T12:00:00') < startOfMonth)
      .reduce((sum, t) => t.type === TransactionType.ENTRADA ? sum + t.amount : sum - t.amount, 0);
    return totalInitialBalance + historicalBalanceChange;
  }, [accounts, transactions, currentMonth, availableTransactionMonths]);

  const monthlyTransactions = useMemo(() => {
    if (availableTransactionMonths.length === 0) return [];
    return transactions.filter(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      return txDate.getMonth() === currentMonth.getMonth() && txDate.getFullYear() === currentMonth.getFullYear();
    });
  }, [transactions, currentMonth, availableTransactionMonths]);

  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    if (summaryPeriod === 'monthly') {
      const monthlyIncome = monthlyTransactions.filter(t => t.type === TransactionType.ENTRADA).reduce((sum, t) => sum + t.amount, 0);
      const monthlyExpenses = monthlyTransactions.filter(t => t.type === TransactionType.SAIDA).reduce((sum, t) => sum + t.amount, 0);
      return { totalIncome: monthlyIncome, totalExpenses: monthlyExpenses, balance: previousMonthBalance + monthlyIncome - monthlyExpenses };
    }
    // Overall
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
    const overallIncome = transactions.filter(t => t.type === TransactionType.ENTRADA).reduce((sum, t) => sum + t.amount, 0);
    const overallExpenses = transactions.filter(t => t.type === TransactionType.SAIDA).reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: overallIncome, totalExpenses: overallExpenses, balance: totalInitialBalance + overallIncome - overallExpenses };
  }, [summaryPeriod, monthlyTransactions, transactions, previousMonthBalance, accounts]);

  
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...transaction, id: crypto.randomUUID() }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const addPerson = (person: Omit<Person, 'id'>) => setPeople(prev => [{ ...person, id: crypto.randomUUID() }, ...prev]);
  const addCreditCard = (card: Omit<CreditCard, 'id'>) => setCreditCards(prev => [{ ...card, id: crypto.randomUUID() }, ...prev]);
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => setGoals(prev => [{ ...goal, id: crypto.randomUUID(), currentAmount: 0 }, ...prev]);
  const addAccount = (account: Omit<Account, 'id'>) => setAccounts(prev => [{ ...account, id: crypto.randomUUID() }, ...prev]);
  const addRecurringTransaction = (rt: Omit<RecurringTransaction, 'id'>) => setRecurringTransactions(prev => [{...rt, id: crypto.randomUUID()}, ...prev]);
  const addInvestment = (inv: Omit<Investment, 'id'>) => setInvestments(prev => [{...inv, id: crypto.randomUUID()}, ...prev]);
  const addDebt = (debt: Omit<Debt, 'id'>) => setDebts(prev => [{...debt, id: crypto.randomUUID()}, ...prev]);

  const handleImportTransactions = (importedTransactions: ParsedTransaction[], accountName: string) => {
    const newTransactions = importedTransactions.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      account: accountName,
      category: 'Importado',
    }));
    setTransactions(prev => [...prev, ...newTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setImportModalOpen(false);
  };
  
  const handleTransfer = (fromAccountId: string, toAccountId: string, amount: number, date: string) => {
    const fromAccount = accounts.find(a => a.id === fromAccountId);
    const toAccount = accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) {
        alert("Contas de origem ou destino não encontradas.");
        return;
    }

    addTransaction({
        type: TransactionType.SAIDA,
        description: `Transferência para ${toAccount.name}`,
        amount,
        date,
        account: fromAccount.name,
        category: 'Transferência'
    });

    addTransaction({
        type: TransactionType.ENTRADA,
        description: `Transferência de ${fromAccount.name}`,
        amount,
        date,
        account: toAccount.name,
        category: 'Transferência'
    });
    
    setTransferModalOpen(false);
  };

  const addValueToGoal = (goalId: string, value: number, accountName: string) => {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, currentAmount: g.currentAmount + value } : g));
      const goal = goals.find(g => g.id === goalId);
      addTransaction({
          type: TransactionType.SAIDA,
          description: `Aporte Meta: ${goal?.name}`,
          amount: value,
          date: new Date().toISOString().split('T')[0],
          account: accountName,
          category: 'Aporte em Meta'
      });
      setAddValueModalOpen(false);
      setTargetGoal(null);
  };
  
  const handleAddCardTransaction = (tx: Omit<CreditCardTransaction, 'id'>, installments: number) => {
    if (installments > 1) {
        const groupId = crypto.randomUUID();
        const newTransactions: CreditCardTransaction[] = [];
        const originalDate = new Date(tx.date + 'T12:00:00');

        for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(originalDate);
            installmentDate.setMonth(originalDate.getMonth() + i);

            newTransactions.push({
                ...tx,
                id: crypto.randomUUID(),
                groupId,
                date: installmentDate.toISOString().split('T')[0],
                description: `${tx.description} (${i + 1}/${installments})`,
                installmentInfo: { current: i + 1, total: installments },
                paid: false,
            });
        }
        setCreditCardTransactions(prev => [...newTransactions, ...prev]);
    } else {
        setCreditCardTransactions(prev => [{ ...tx, id: crypto.randomUUID(), paid: false }, ...prev]);
    }
  };

  const handleEditTransaction = (updatedTx: Transaction) => { setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t)); setEditingTarget(null); };
  const handleEditCardTransaction = (updatedTx: CreditCardTransaction) => { setCreditCardTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t)); setEditingTarget(null); };
  const handleEditCard = (updatedCard: CreditCard) => { setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c)); setEditingTarget(null); };
  const handleEditPerson = (updatedPerson: Person) => { setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p)); setEditingTarget(null); };
  const handleEditGoal = (updatedGoal: Goal) => { setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g)); setEditingTarget(null); };
  const handleEditAccount = (updatedAccount: Account) => { setAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a)); setEditingTarget(null); };
  const handleEditRecurringTransaction = (updatedRt: RecurringTransaction) => { setRecurringTransactions(prev => prev.map(rt => rt.id === updatedRt.id ? updatedRt : rt)); setEditingTarget(null); };
  const handleEditInvestment = (updatedInv: Investment) => { setInvestments(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv)); setEditingTarget(null); };
  const handleEditDebt = (updatedDebt: Debt) => { setDebts(prev => prev.map(d => d.id === updatedDebt.id ? updatedDebt : d)); setEditingTarget(null); };

  const handlePayInstallment = (debt: Debt) => {
    const installmentAmount = debt.totalAmount / debt.numberOfInstallments;
    const account = accounts.find(a => a.id === debt.accountId);

    if (!account) {
        alert('Conta para débito não encontrada!');
        return;
    }

    const confirmPayment = () => {
        setDebts(prev => prev.map(d => 
            d.id === debt.id ? { ...d, paidInstallments: d.paidInstallments + 1 } : d
        ));

        const installmentNumber = debt.paidInstallments + 1;
        
        addTransaction({
            type: TransactionType.SAIDA,
            description: `Pagamento Parcela ${installmentNumber}/${debt.numberOfInstallments} - ${debt.name}`,
            amount: installmentAmount,
            date: new Date().toISOString().split('T')[0], // Pay on the current day
            account: account.name,
            category: 'Pagamento de Empréstimo',
        });
        
        setConfirmationModalOpen(false);
    };

    setConfirmationProps({
        onConfirm: confirmPayment,
        title: "Confirmar Pagamento de Parcela",
        message: `Confirma o pagamento da parcela de ${formatCurrency(installmentAmount)} para "${debt.name}" da conta "${account.name}"?`,
        confirmText: "Sim, Pagar",
        confirmButtonClass: "bg-emerald-600 hover:bg-emerald-700"
    });
    setConfirmationModalOpen(true);
}


  const handleDelete = () => {
    if (!deletionTarget) return;
    switch (deletionTarget.type) {
      case 'transaction': setTransactions(prev => prev.filter(t => t.id !== deletionTarget.id)); break;
      case 'cardTransaction': setCreditCardTransactions(prev => prev.filter(t => t.id !== deletionTarget.id)); break;
      case 'card':
        setCreditCards(prev => prev.filter(c => c.id !== deletionTarget.id));
        setCreditCardTransactions(prev => prev.filter(t => t.cardId !== deletionTarget.id));
        break;
      case 'person':
        setPeople(prev => prev.filter(p => p.id !== deletionTarget.id));
        setCreditCardTransactions(prev => prev.map(t => t.personId === deletionTarget.id ? { ...t, personId: undefined } : t));
        break;
      case 'goal': setGoals(prev => prev.filter(g => g.id !== deletionTarget.id)); break;
      case 'account':
        const accountToDelete = accounts.find(a => a.id === deletionTarget.id);
        if (transactions.some(t => t.account === accountToDelete?.name) || creditCards.some(c => c.accountId === accountToDelete?.id)) {
            alert('Não é possível excluir uma conta com transações ou cartões associados.');
        } else {
            setAccounts(prev => prev.filter(a => a.id !== deletionTarget.id));
        }
        break;
      case 'recurringTransaction': setRecurringTransactions(prev => prev.filter(rt => rt.id !== deletionTarget.id)); break;
      case 'investment': setInvestments(prev => prev.filter(inv => inv.id !== deletionTarget.id)); break;
      case 'debt': setDebts(prev => prev.filter(d => d.id !== deletionTarget.id)); break;
    }
    setDeletionTarget(null);
    setConfirmationModalOpen(false);
  };

  const openAddCardTransactionModal = (cardId: string) => { setCardTxModalDefaultId(cardId); setAddCardTxModalOpen(true); };

  const openEditModal = (data: any, type: EditingTarget['type']) => {
    setEditingTarget({ data, type });
    switch (type) {
      case 'transaction': setTxModalOpen(true); break;
      case 'cardTransaction': setAddCardTxModalOpen(true); break;
      case 'card': setAddCardModalOpen(true); break;
      case 'goal': setGoalModalOpen(true); break;
      case 'recurringTransaction': setRecurringTxModalOpen(true); break;
      case 'investment': setInvestmentModalOpen(true); break;
      case 'debt': setDebtModalOpen(true); break;
      case 'person': break; 
      case 'account': break;
    }
  };

  const closeModals = () => {
    setTxModalOpen(false); setAddCardModalOpen(false); setAddCardTxModalOpen(false); setGoalModalOpen(false); setAddValueModalOpen(false);
    setRecurringTxModalOpen(false); setInvestmentModalOpen(false); setDebtModalOpen(false); setImportModalOpen(false); setTransferModalOpen(false);
    setEditingTarget(null); setTargetGoal(null);
  }

    const accountBalances = useMemo(() => {
        return accounts.map(account => {
            const balance = transactions.reduce((acc, t) => {
                if (t.account === account.name) {
                    return t.type === TransactionType.ENTRADA ? acc + t.amount : acc - t.amount;
                }
                return acc;
            }, account.initialBalance);
            return { ...account, currentBalance: balance };
        });
    }, [accounts, transactions]);

    const projectedBalances = useMemo(() => {
        if (!expectationDate) {
            return accountBalances.map(acc => ({ ...acc, isProjected: false }));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(expectationDate + 'T23:59:59');

        const projections: { [key: string]: number } = {};
        accountBalances.forEach(acc => {
            projections[acc.id] = acc.currentBalance;
        });

        // 1. Recurring Transactions
        recurringTransactions.forEach(rt => {
            let nextDueDate = new Date(rt.nextDueDate + 'T12:00:00');
            const account = accounts.find(a => a.name === rt.account);
            if (!account) return;

            while (nextDueDate <= targetDate) {
                if (nextDueDate >= today) {
                    if (rt.type === TransactionType.ENTRADA) {
                        projections[account.id] += rt.amount;
                    } else {
                        projections[account.id] -= rt.amount;
                    }
                }
                
                const newNextDueDate = new Date(nextDueDate);
                if (rt.frequency === RecurringTransactionFrequency.MENSAL) {
                    newNextDueDate.setMonth(newNextDueDate.getMonth() + 1);
                } else if (rt.frequency === RecurringTransactionFrequency.ANUAL) {
                    newNextDueDate.setFullYear(newNextDueDate.getFullYear() + 1);
                }
                nextDueDate = newNextDueDate;
            }
        });

        // 2. Credit Card Invoices
        creditCards.forEach(card => {
            const unpaidTxs = creditCardTransactions.filter(tx => tx.cardId === card.id && !tx.paid);
            if (unpaidTxs.length === 0) return;

            let checkDate = new Date(today);
            checkDate.setDate(1); 
            
            while (checkDate <= targetDate) {
                const dueDateInMonth = new Date(checkDate.getFullYear(), checkDate.getMonth(), card.dueDate);
                
                if (dueDateInMonth > today && dueDateInMonth <= targetDate) {
                    const closingDate = new Date(dueDateInMonth);
                    closingDate.setDate(card.closingDay);
                    if (card.dueDate < card.closingDay) { // Invoice is for previous month's transactions
                         closingDate.setMonth(closingDate.getMonth() - 1);
                    }
                   
                    const prevClosingDate = new Date(closingDate);
                    prevClosingDate.setMonth(prevClosingDate.getMonth() - 1);
                    
                    const invoiceTotal = unpaidTxs.reduce((sum, tx) => {
                        const txDate = new Date(tx.date + 'T12:00:00');
                        if (txDate > prevClosingDate && txDate <= closingDate) {
                            return sum + tx.amount;
                        }
                        return sum;
                    }, 0);

                    if (invoiceTotal > 0) {
                        projections[card.accountId] -= invoiceTotal;
                    }
                }
                checkDate.setMonth(checkDate.getMonth() + 1);
            }
        });

        // 3. Debts
        debts.forEach(debt => {
            const installmentValue = debt.totalAmount / debt.numberOfInstallments;
            for (let i = debt.paidInstallments; i < debt.numberOfInstallments; i++) {
                const dueDate = new Date(debt.firstDueDate + 'T12:00:00');
                dueDate.setMonth(dueDate.getMonth() + i);

                if (dueDate > today && dueDate <= targetDate) {
                    projections[debt.accountId] -= installmentValue;
                }
            }
        });

        return accountBalances.map(acc => ({
            ...acc,
            currentBalance: projections[acc.id],
            isProjected: true,
        }));
    }, [expectationDate, accountBalances, recurringTransactions, creditCards, creditCardTransactions, debts, accounts]);


  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'transactions': return <TransactionsView />;
      case 'goals': return <GoalsView />;
      case 'analysis': return <SmartAnalysis transactions={transactions} creditCardTransactions={creditCardTransactions}/>;
      case 'cards': return <CardsView />;
      case 'people': return <PeopleView />;
      case 'accounts': return <AccountsView />;
      case 'patrimonio': return <PatrimonioView />;
      default: return <DashboardView />;
    }
  };
  
  const DashboardView = () => {
    const displayTransactions = summaryPeriod === 'monthly' ? monthlyTransactions : transactions;

    const filteredCreditCardTransactions = useMemo(() => {
        if (summaryPeriod === 'overall') return creditCardTransactions;
        if (availableTransactionMonths.length === 0) return [];
        return creditCardTransactions.filter(t => {
            const txDate = new Date(t.date + 'T12:00:00');
            return txDate.getMonth() === currentMonth.getMonth() && txDate.getFullYear() === currentMonth.getFullYear();
        });
    }, [creditCardTransactions, summaryPeriod, currentMonth, availableTransactionMonths]);

    const expenseData = useMemo(() => {
        const dataByCategory = [...displayTransactions.filter(t => t.type === TransactionType.SAIDA), ...filteredCreditCardTransactions]
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {} as {[key: string]: number});
        return Object.entries(dataByCategory).map(([name, value]) => ({ name, value }));
    }, [displayTransactions, filteredCreditCardTransactions]);
    
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'];
    const chartTooltipFormatter = (value: number) => areValuesVisible ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : 'R$ ****,**';
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedPieLabel = ({ cx, cy, midAngle, outerRadius, percent, value }) => {
        if (percent < 0.02) { // Don't render for slices smaller than 2%
            return null;
        }
        const radius = outerRadius + 25; // Position label outside the pie
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                {value}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-2">
                    {summaryPeriod === 'monthly' && (
                        <>
                           <button onClick={goToPreviousMonth} disabled={currentMonthIndex >= availableTransactionMonths.length - 1} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-left"/></button>
                            <span className="font-semibold w-36 text-center capitalize">{availableTransactionMonths.length > 0 ? currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem Dados'}</span>
                           <button onClick={goToNextMonth} disabled={currentMonthIndex <= 0} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-right"/></button>
                        </>
                    )}
                </div>
                <div className="flex bg-slate-700/80 p-1 rounded-lg">
                    <button onClick={() => setSummaryPeriod('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${summaryPeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Mensal</button>
                    <button onClick={() => setSummaryPeriod('overall')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${summaryPeriod === 'overall' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Geral</button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-emerald-400 mb-1">Receita</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-rose-400 mb-1">Despesa</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-indigo-400 mb-1">Saldo Final</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(balance)}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">Despesas por Categoria</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie 
                                data={expenseData} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={80} 
                                fill="#8884d8" 
                                labelLine={areValuesVisible}
                                label={areValuesVisible ? renderCustomizedPieLabel : false}
                            >
                                {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={chartTooltipFormatter} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">Receitas vs Despesas</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[{ name: 'Fluxo de Caixa', Receitas: totalIncome, Despesas: totalExpenses + filteredCreditCardTransactions.reduce((acc, t) => acc + t.amount, 0) }]}>
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" tickFormatter={(value) => areValuesVisible ? `R$ ${value/1000}k` : ''} />
                            <Tooltip formatter={chartTooltipFormatter} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', borderRadius: '0.5rem' }} />
                            <Legend />
                            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
  };
  
  const TransactionsView = () => {
    const displayTransactions = summaryPeriod === 'monthly' ? monthlyTransactions : transactions;

    return (
     <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
                 <div className="flex bg-slate-700/80 p-1 rounded-lg">
                    <button onClick={() => setTransactionsSubView('current')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${transactionsSubView === 'current' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Lançamentos</button>
                    <button onClick={() => setTransactionsSubView('recurring')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${transactionsSubView === 'recurring' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Recorrentes</button>
                </div>
            </div>
            {transactionsSubView === 'current' ? (
                 <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setImportModalOpen(true)} className="bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
                        <Icon name="file-import" className="mr-2"/> Importar Extrato
                    </button>
                    <div className="flex items-center gap-2">
                        {summaryPeriod === 'monthly' && (
                            <>
                                <button onClick={goToPreviousMonth} disabled={currentMonthIndex >= availableTransactionMonths.length - 1} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-left"/></button>
                                <span className="font-semibold w-36 text-center capitalize text-sm">{availableTransactionMonths.length > 0 ? currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem Dados'}</span>
                                <button onClick={goToNextMonth} disabled={currentMonthIndex <= 0} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-right"/></button>
                            </>
                        )}
                        <div className="flex bg-slate-700/80 p-1 rounded-lg">
                            <button onClick={() => setSummaryPeriod('monthly')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${summaryPeriod === 'monthly' ? 'bg-slate-600 text-white' : 'text-slate-300'}`}>Mensal</button>
                            <button onClick={() => setSummaryPeriod('overall')} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${summaryPeriod === 'overall' ? 'bg-slate-600 text-white' : 'text-slate-300'}`}>Geral</button>
                        </div>
                    </div>
                </div>
            ) : (
                <button onClick={() => setRecurringTxModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"><Icon name="plus" className="mr-2"/> Novo Recorrente</button>
            )}
        </div>

       {transactionsSubView === 'current' ? (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                        <th className="py-3 px-4 font-medium">Descrição</th> <th className="py-3 px-4 font-medium">Valor</th>
                        <th className="py-3 px-4 hidden md:table-cell font-medium">Data</th> <th className="py-3 px-4 hidden lg:table-cell font-medium">Categoria</th>
                        <th className="py-3 px-4 hidden lg:table-cell font-medium">Conta</th>
                        <th className="py-3 px-4 font-medium text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {displayTransactions.map(t => (
                        <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800">
                            <td className="py-4 px-4 font-medium text-white">{t.description}</td>
                            <td className={`py-4 px-4 font-bold ${t.type === TransactionType.ENTRADA ? 'text-emerald-400' : 'text-rose-400'}`}> {formatCurrency(t.amount)} </td>
                            <td className="py-4 px-4 text-slate-300 hidden md:table-cell">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                            <td className="py-4 px-4 text-slate-300 hidden lg:table-cell">{t.category}</td>
                            <td className="py-4 px-4 text-slate-300 hidden lg:table-cell">{t.account}</td>
                            <td className="py-4 px-4 space-x-4 text-right">
                                <button onClick={() => openEditModal(t, 'transaction')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                                <button onClick={() => { setDeletionTarget({ id: t.id, type: 'transaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
       ) : (
        <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                        <th className="py-3 px-4 font-medium">Descrição</th> <th className="py-3 px-4 font-medium">Valor</th>
                        <th className="py-3 px-4 hidden md:table-cell font-medium">Frequência</th> <th className="py-3 px-4 hidden lg:table-cell font-medium">Próximo Vencimento</th>
                        <th className="py-3 px-4 hidden lg:table-cell font-medium">Conta</th>
                        <th className="py-3 px-4 font-medium text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {recurringTransactions.map(rt => (
                         <tr key={rt.id} className="border-b border-slate-800 hover:bg-slate-800">
                           <td className="py-4 px-4 font-medium text-white">{rt.description}</td>
                           <td className={`py-4 px-4 font-bold ${rt.type === TransactionType.ENTRADA ? 'text-emerald-400' : 'text-rose-400'}`}> {formatCurrency(rt.amount)} </td>
                           <td className="py-4 px-4 text-slate-300 hidden md:table-cell">{rt.frequency}</td>
                           <td className="py-4 px-4 text-slate-300 hidden lg:table-cell">{new Date(rt.nextDueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                           <td className="py-4 px-4 text-slate-300 hidden lg:table-cell">{rt.account}</td>
                           <td className="py-4 px-4 space-x-4 text-right">
                               <button onClick={() => openEditModal(rt, 'recurringTransaction')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                               <button onClick={() => { setDeletionTarget({ id: rt.id, type: 'recurringTransaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                           </td>
                       </tr>
                    ))}
                </tbody>
            </table>
        </div>
       )}
     </div>
    );
  }
    
  const GoalsView = () => (
     <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
       <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Minhas Metas</h2>
            <button onClick={() => setGoalModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                <Icon name="plus" className="mr-2"/> Nova Meta
            </button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <div key={goal.id} className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-white text-lg">{goal.name}</h3>
                        <p className="text-sm text-slate-300">
                            <span className="font-bold text-white">{formatCurrency(goal.currentAmount)}</span> / {formatCurrency(goal.targetAmount)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={() => openEditModal(goal, 'goal')} className="text-slate-400 hover:text-indigo-400"><Icon name="pencil"/></button>
                         <button onClick={() => { setDeletionTarget({ id: goal.id, type: 'goal' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400"><Icon name="trash"/></button>
                    </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                  <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${progress > 100 ? 100 : progress}%` }}></div>
                </div>
                <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-indigo-400">{progress.toFixed(1)}%</p>
                    <button onClick={() => { setTargetGoal(goal); setAddValueModalOpen(true); }} className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-emerald-700">
                        <Icon name="plus" className="mr-1.5"/> Adicionar Valor
                    </button>
                </div>
              </div>
            );
          })}
       </div>
     </div>
  );
  
  const AccountsView = () => {
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountBalance, setNewAccountBalance] = useState('');

    const handleAddOrUpdateAccount = (e: React.FormEvent) => {
        e.preventDefault();
        const balance = parseFloat(newAccountBalance);
        if (newAccountName.trim() && !isNaN(balance)) {
             if (editingTarget?.type === 'account') {
                handleEditAccount({ ...editingTarget.data, name: newAccountName, initialBalance: balance });
             } else {
                addAccount({ name: newAccountName.trim(), initialBalance: balance });
             }
             setNewAccountName('');
             setNewAccountBalance('');
             setEditingTarget(null);
        }
    }
    
    useEffect(() => {
        if (editingTarget?.type === 'account') {
            setNewAccountName(editingTarget.data.name);
            setNewAccountBalance(String(editingTarget.data.initialBalance));
        } else {
            setNewAccountName('');
            setNewAccountBalance('');
        }
    }, [editingTarget]);

    const selectedDateForPicker = expectationDate ? new Date(expectationDate + 'T12:00:00') : null;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
             <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
                <h2 className="text-2xl font-bold text-white">Minhas Contas</h2>
                <button 
                    onClick={() => setTransferModalOpen(true)}
                    className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors flex items-center"
                >
                    <Icon name="right-left" className="mr-2" />
                    Transferir entre contas
                </button>
            </div>


            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                <h3 className="font-semibold text-white mb-2">Expectativa de Saldo</h3>
                <p className="text-sm text-slate-400 mb-3">Selecione uma data futura para projetar seus saldos, considerando despesas recorrentes, faturas e dívidas.</p>
                <div className="flex items-center gap-3 relative">
                     <button
                        onClick={() => setDatePickerOpen(true)}
                        className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left"
                    >
                       {expectationDate 
                           ? new Date(expectationDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                           : 'Selecione uma data...'}
                    </button>

                    <button 
                        onClick={() => setExpectationDate(null)} 
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!expectationDate}
                    >
                        Limpar
                    </button>
                </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
                <h3 className="font-semibold text-white mb-3">{editingTarget?.type === 'account' ? 'Editar Conta' : 'Adicionar Nova Conta'}</h3>
                <form onSubmit={handleAddOrUpdateAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="Nome da conta"
                           className="sm:col-span-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <input type="number" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} placeholder="Saldo inicial (R$)" step="0.01"
                           className="sm:col-span-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                            {editingTarget?.type === 'account' ? 'Salvar' : 'Adicionar'}
                        </button>
                         {editingTarget?.type === 'account' && (
                             <button type="button" onClick={() => setEditingTarget(null)} className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-500">Cancelar</button>
                         )}
                    </div>
                </form>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">
                {expectationDate 
                    ? `Saldos Projetados para ${new Date(expectationDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
                    : 'Saldos Atuais'}
            </h3>

            <ul className="space-y-3">
                {projectedBalances.map(acc => (
                    <li key={acc.id} className="group flex justify-between items-center bg-slate-800 p-4 rounded-lg text-white">
                         <div>
                            <span className="font-bold text-lg">{acc.name}</span>
                            {!acc.isProjected &&
                                <p className="text-xs text-slate-400">Saldo Inicial: {formatCurrency(acc.initialBalance)}</p>
                            }
                         </div>
                         <div className="flex items-center gap-4">
                            <div className="text-right">
                                <span className={`font-bold text-xl ${acc.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(acc.currentBalance)}</span>
                            </div>
                            {!acc.isProjected &&
                                <div className="space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditModal(acc, 'account')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                                    <button onClick={() => { setDeletionTarget({ id: acc.id, type: 'account' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                                </div>
                            }
                         </div>
                    </li>
                ))}
            </ul>
        </div>
    );
  }

  const PeopleView = () => {
      const [newPersonName, setNewPersonName] = useState('');

      const handleAddOrUpdatePerson = (e: React.FormEvent) => {
          e.preventDefault();
          if (editingTarget && editingTarget.type === 'person') {
              handleEditPerson({ ...editingTarget.data, name: newPersonName });
          } else {
              if(newPersonName.trim()) {
                  addPerson({name: newPersonName.trim()});
              }
          }
          setNewPersonName('');
      }

      useEffect(() => {
        if (editingTarget && editingTarget.type === 'person') {
            setNewPersonName(editingTarget.data.name);
        } else {
            setNewPersonName('');
        }
      }, [editingTarget]);

      return (
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
           <h2 className="text-2xl font-bold text-white mb-4">
            {editingTarget && editingTarget.type === 'person' ? 'Editar Pessoa' : 'Gerenciar Pessoas'}
           </h2>
           <form onSubmit={handleAddOrUpdatePerson} className="flex gap-3 mb-6">
               <input type="text" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Nome da pessoa"
                      className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
               <button type="submit" className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                {editingTarget && editingTarget.type === 'person' ? 'Salvar' : 'Adicionar'}
               </button>
               {editingTarget && editingTarget.type === 'person' && (
                <button type="button" onClick={() => setEditingTarget(null)} className="bg-slate-600 text-white px-5 py-2 rounded-lg hover:bg-slate-500 transition-colors">
                    Cancelar
                </button>
               )}
           </form>
           <ul className="space-y-2">
               {people.map(p => (
                   <li key={p.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-lg text-white">
                        <span className="font-medium">{p.name}</span>
                        <div className="space-x-4">
                            <button onClick={() => openEditModal(p, 'person')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                            <button onClick={() => { setDeletionTarget({ id: p.id, type: 'person' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                        </div>
                   </li>
               ))}
           </ul>
        </div>
      );
  }

  const CardsView = () => {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(creditCards[0]?.id || null);

    const availableMonths = useMemo(() => {
        if (!selectedCardId) return [];
        const cardTransactions = creditCardTransactions.filter(t => t.cardId === selectedCardId);
        const selectedCard = creditCards.find(c => c.id === selectedCardId);
        if (!selectedCard) return [];

        const months = new Set<string>();
        cardTransactions.forEach(t => {
            const txDate = new Date(t.date + 'T12:00:00');
            let statementYear = txDate.getFullYear();
            let statementMonth = txDate.getMonth();
            
            if (txDate.getDate() > selectedCard.closingDay) {
                statementMonth += 1;
                if (statementMonth > 11) {
                    statementMonth = 0;
                    statementYear += 1;
                }
            }
            months.add(`${statementYear}-${String(statementMonth + 1).padStart(2, '0')}`);
        });
        
        return Array.from(months).map(m => new Date(m + '-02T12:00:00')).sort((a, b) => b.getTime() - a.getTime());
    }, [selectedCardId, creditCardTransactions, creditCards]);
    
    const [currentCardMonthIndex, setCurrentCardMonthIndex] = useState(0);
    const statementDate = availableMonths[currentCardMonthIndex] || new Date();
    const selectedCard = useMemo(() => creditCards.find(c => c.id === selectedCardId), [selectedCardId]);

    const { statementTransactions, total, totalByPerson, isStatementPaid } = useMemo(() => {
        if (!selectedCard || availableMonths.length === 0) return { statementTransactions: [], total: 0, totalByPerson: [], isStatementPaid: false };
        
        const year = statementDate.getFullYear();
        const month = statementDate.getMonth();
        const endDate = new Date(year, month, selectedCard.closingDay, 23, 59, 59);
        const startDate = new Date(year, month - 1, selectedCard.closingDay + 1, 0, 0, 0);

        const filtered = creditCardTransactions.filter(t => {
            const txDate = new Date(t.date + 'T12:00:00');
            return t.cardId === selectedCard.id && txDate >= startDate && txDate <= endDate;
        });

        const byPerson = filtered.reduce((acc, t) => {
            if (t.personId) {
                const personName = people.find(p => p.id === t.personId)?.name || 'Não especificado';
                acc[personName] = (acc[personName] || 0) + t.amount;
            }
            return acc;
        }, {} as {[key: string]: number});

        return {
            statementTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            total: filtered.reduce((sum, t) => sum + t.amount, 0),
            totalByPerson: Object.entries(byPerson).map(([name, amount]) => ({ name, amount })),
            isStatementPaid: filtered.length > 0 && filtered.every(t => t.paid),
        };
    }, [selectedCard, statementDate, creditCardTransactions, people, availableMonths]);

    const { usedLimit, availableLimit } = useMemo(() => {
      if (!selectedCard) return { usedLimit: 0, availableLimit: 0 };
      const unpaidTotal = creditCardTransactions
        .filter(t => t.cardId === selectedCard.id && !t.paid)
        .reduce((sum, t) => sum + t.amount, 0);
      return { usedLimit: unpaidTotal, availableLimit: selectedCard.limit - unpaidTotal };
    }, [selectedCard, creditCardTransactions]);

    const handleConfirmPayInvoice = () => {
      if (!selectedCard) return;

      const accountToDebit = accounts.find(acc => acc.id === selectedCard.accountId);
      if (!accountToDebit) {
          alert("A conta associada a este cartão não foi encontrada. Verifique as configurações do cartão.");
          setConfirmationModalOpen(false);
          return;
      }

      const idsToPay = statementTransactions.map(t => t.id);
      setCreditCardTransactions(prev => prev.map(t => idsToPay.includes(t.id) ? { ...t, paid: true } : t));
      addTransaction({
          type: TransactionType.SAIDA,
          description: `Pagamento Fatura ${selectedCard.name}`,
          amount: total,
          date: new Date().toISOString().split('T')[0],
          account: accountToDebit.name,
          category: 'Pagamento de Fatura',
      });
      setConfirmationModalOpen(false);
    };

    const triggerPayInvoiceConfirmation = () => {
        setConfirmationProps({
            onConfirm: handleConfirmPayInvoice,
            title: "Confirmar Pagamento",
            message: `Deseja pagar a fatura de ${formatCurrency(total)}? Um lançamento de despesa será criado.`,
            confirmText: "Sim, Pagar",
            confirmButtonClass: "bg-emerald-600 hover:bg-emerald-700"
        });
        setConfirmationModalOpen(true);
    }
    
    useEffect(() => { if (selectedCardId) { setCurrentCardMonthIndex(0); } }, [selectedCardId, availableMonths.length]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Meus Cartões</h2>
                <button onClick={() => setAddCardModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center shadow-lg shadow-indigo-600/30">
                    <Icon name="plus" className="mr-2"/> Novo Cartão
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creditCards.map(card => (
                    <div key={card.id} onClick={() => setSelectedCardId(card.id)}
                         className={`group relative p-6 rounded-2xl cursor-pointer text-white shadow-lg bg-gradient-to-br transition-all duration-300 ${card.color} ${selectedCardId === card.id ? 'ring-2 ring-white/50 scale-100' : 'scale-95 hover:scale-100 opacity-70 hover:opacity-100'} h-52 flex flex-col justify-between`}>
                        
                        <div className="flex justify-between items-start">
                           <span className="font-bold text-lg text-white/90">{card.name}</span>
                           <span className="font-semibold text-white/80">{card.brand}</span>
                        </div>
                        
                        <div>
                            <p className="font-mono tracking-widest text-2xl text-center mb-4 opacity-80">**** **** **** {card.last4Digits}</p>
                            <div className="flex justify-between items-end">
                                <p className="font-bold text-lg">{card.bank}</p>
                                <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${selectedCardId === card.id ? 'opacity-100' : ''}`}>
                                   <button onClick={(e) => { e.stopPropagation(); openEditModal(card, 'card')}} className="text-white/80 hover:text-white/100 backdrop-blur-sm bg-black/20 rounded-full w-9 h-9 flex items-center justify-center transition-colors"><Icon name="pencil"/></button>
                                   <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ id: card.id, type: 'card' }); setConfirmationModalOpen(true); }} className="text-white/80 hover:text-white/100 backdrop-blur-sm bg-black/20 rounded-full w-9 h-9 flex items-center justify-center transition-colors"><Icon name="trash"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedCard && (
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                       <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">Fatura de {selectedCard.name}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => setCurrentCardMonthIndex(prev => prev + 1)} disabled={currentCardMonthIndex >= availableMonths.length - 1} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Icon name="chevron-left"/></button>
                                <span className="font-semibold w-36 text-center capitalize">{availableMonths.length > 0 ? statementDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Sem Faturas'}</span>
                                <button onClick={() => setCurrentCardMonthIndex(prev => prev - 1)} disabled={currentCardMonthIndex <= 0} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Icon name="chevron-right"/></button>
                            </div>
                       </div>
                       <div className="text-left sm:text-right">
                            <p className="text-slate-300">Total da Fatura: <span className={`font-bold text-3xl ${isStatementPaid ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(total)}</span></p>
                            <p className="text-sm text-slate-400">Fecha em: {selectedCard.closingDay}/{statementDate.getMonth()+1} | Vence em: {selectedCard.dueDate}/{statementDate.getMonth()+1}</p>
                       </div>
                    </div>
                     <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-400 mb-1">
                            <span>Limite Utilizado (Total: {formatCurrency(selectedCard.limit)})</span>
                            <span>Disponível</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2.5">
                            <div className="bg-rose-500 h-2.5 rounded-full" style={{ width: `${(usedLimit / selectedCard.limit) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-white mt-1">
                            <span>{formatCurrency(usedLimit)}</span>
                            <span>{formatCurrency(availableLimit)}</span>
                        </div>
                    </div>
                    <div className="flex gap-4 justify-end mb-6">
                        <button onClick={triggerPayInvoiceConfirmation} disabled={isStatementPaid || statementTransactions.length === 0} className={`font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${isStatementPaid ? 'bg-emerald-600/50 cursor-default' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                           <Icon name={isStatementPaid ? "check-circle" : "dollar-sign"} className="mr-2"/> {isStatementPaid ? 'Fatura Paga' : 'Pagar Fatura'}
                        </button>
                        <button onClick={() => openAddCardTransactionModal(selectedCard.id)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
                            <Icon name="plus" className="mr-2"/> Novo Gasto
                        </button>
                    </div>
                     {totalByPerson.length > 0 &&
                        <div className="mb-6 p-4 bg-slate-900/50 rounded-xl">
                             <h4 className="font-semibold text-white mb-2">Gastos por Pessoa</h4>
                             <ul className="space-y-1 text-sm">
                                {totalByPerson.map(p => (
                                    <li key={p.name} className="flex justify-between text-slate-300">
                                        <span>{p.name}</span>
                                        <span className="font-medium text-white">{formatCurrency(p.amount)}</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                     }
                    <div className="space-y-3">
                        {statementTransactions.length > 0 ? statementTransactions.map(t => (
                            <div key={t.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-lg group">
                                <div>
                                    <p className="font-semibold text-white">{t.description}</p>
                                    <p className="text-sm text-slate-400">{new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')} - {t.category}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className={`font-bold ${t.paid ? 'text-emerald-400' : areValuesVisible ? 'text-rose-400' : 'text-slate-200'}`}>{formatCurrency(t.amount)}</p>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                        <button onClick={() => openEditModal(t, 'cardTransaction')} className="text-slate-400 hover:text-indigo-400 transition-colors" disabled={t.paid}><Icon name="pencil"/></button>
                                        <button onClick={() => { setDeletionTarget({ id: t.id, type: 'cardTransaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors" disabled={t.paid}><Icon name="trash"/></button>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-center text-slate-400 py-6">Nenhum lançamento nesta fatura.</p>}
                    </div>
                </div>
            )}
        </div>
    );
  }

    const PatrimonioView = () => {
    const totalInvestments = useMemo(() => investments.reduce((sum, inv) => sum + inv.currentValue, 0), [investments]);
    const totalDebts = useMemo(() => debts.reduce((sum, debt) => {
        const installmentValue = debt.totalAmount / debt.numberOfInstallments;
        const remainingInstallments = debt.numberOfInstallments - debt.paidInstallments;
        return sum + (installmentValue * remainingInstallments);
    }, 0), [debts]);
    const netWorth = totalInvestments - totalDebts;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-cyan-400 mb-1">Total Investido</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(totalInvestments)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-amber-400 mb-1">Total Dívidas</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(totalDebts)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-violet-400 mb-1">Patrimônio Líquido</h3>
                    <p className="text-3xl font-semibold text-white">{formatCurrency(netWorth)}</p>
                </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                    <div className="flex bg-slate-700/80 p-1 rounded-lg">
                        <button onClick={() => setPatrimonioSubView('investments')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${patrimonioSubView === 'investments' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Investimentos</button>
                        <button onClick={() => setPatrimonioSubView('debts')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${patrimonioSubView === 'debts' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Dívidas e Empréstimos</button>
                    </div>
                    <button onClick={() => patrimonioSubView === 'investments' ? setInvestmentModalOpen(true) : setDebtModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        <Icon name="plus" className="mr-2"/> {patrimonioSubView === 'investments' ? 'Novo Investimento' : 'Nova Dívida'}
                    </button>
                </div>

                {patrimonioSubView === 'investments' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="py-3 px-4 font-medium">Ativo</th>
                                    <th className="py-3 px-4 font-medium">Tipo</th>
                                    <th className="py-3 px-4 hidden md:table-cell font-medium">Valor Atual</th>
                                    <th className="py-3 px-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investments.map(inv => (
                                    <tr key={inv.id} className="border-b border-slate-800 hover:bg-slate-800">
                                        <td className="py-4 px-4 font-medium text-white">{inv.name}</td>
                                        <td className="py-4 px-4 text-slate-300">{inv.type}</td>
                                        <td className="py-4 px-4 hidden md:table-cell font-bold text-cyan-300">{formatCurrency(inv.currentValue)}</td>
                                        <td className="py-4 px-4 space-x-4 text-right">
                                            <button onClick={() => openEditModal(inv, 'investment')} className="text-slate-400 hover:text-indigo-400"><Icon name="pencil"/></button>
                                            <button onClick={() => { setDeletionTarget({ id: inv.id, type: 'investment' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400"><Icon name="trash"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                         <table className="w-full text-left">
                           <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="py-3 px-4 font-medium">Descrição</th>
                                    <th className="py-3 px-4 hidden md:table-cell font-medium">Valor Total</th>
                                    <th className="py-3 px-4 font-medium">Saldo Devedor</th>
                                    <th className="py-3 px-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debts.map(debt => {
                                    const installmentAmount = debt.totalAmount / debt.numberOfInstallments;
                                    const remainingAmount = installmentAmount * (debt.numberOfInstallments - debt.paidInstallments);
                                    const isExpanded = expandedDebtId === debt.id;
                                    return (
                                     <React.Fragment key={debt.id}>
                                        <tr className="border-b border-slate-800 hover:bg-slate-800/70 cursor-pointer" onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}>
                                            <td className="py-4 px-4 font-medium text-white flex items-center">
                                                <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="mr-3 w-4 transition-transform" />
                                                {debt.name}
                                                <span className="ml-2 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{debt.paidInstallments}/{debt.numberOfInstallments}</span>
                                            </td>
                                            <td className="py-4 px-4 hidden md:table-cell text-slate-300">{formatCurrency(debt.totalAmount)}</td>
                                            <td className="py-4 px-4 font-bold text-amber-300">{formatCurrency(remainingAmount)}</td>
                                            <td className="py-4 px-4 space-x-4 text-right">
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(debt, 'debt'); }} className="text-slate-400 hover:text-indigo-400"><Icon name="pencil"/></button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ id: debt.id, type: 'debt' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400"><Icon name="trash"/></button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-slate-900/50">
                                                <td colSpan={4} className="p-4">
                                                    <h4 className="font-semibold text-white mb-3">Detalhes das Parcelas</h4>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                        {Array.from({ length: debt.numberOfInstallments }, (_, i) => {
                                                            const installmentNumber = i + 1;
                                                            const isPaid = installmentNumber <= debt.paidInstallments;
                                                            const isNext = installmentNumber === debt.paidInstallments + 1;
                                                            const installmentValue = debt.totalAmount / debt.numberOfInstallments;
                                                            
                                                            const dueDate = new Date(debt.firstDueDate + 'T12:00:00');
                                                            dueDate.setMonth(dueDate.getMonth() + i);

                                                            return (
                                                                <div key={i} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-lg text-sm">
                                                                    <div>
                                                                        <span className={`font-semibold ${isPaid ? 'text-slate-400 line-through' : 'text-white'}`}>
                                                                            {installmentNumber}ª Parcela
                                                                        </span>
                                                                        <span className="text-slate-400 ml-4">
                                                                            Venc.: {dueDate.toLocaleDateString('pt-BR')}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className={`font-bold ${isPaid ? 'text-emerald-500' : 'text-slate-300'}`}>
                                                                            {formatCurrency(installmentValue)}
                                                                        </span>
                                                                        {isPaid ? (
                                                                            <span className="text-emerald-500 font-bold flex items-center gap-1.5 text-xs"><Icon name="check-circle" /> Paga</span>
                                                                        ) : isNext ? (
                                                                            <button 
                                                                                onClick={() => handlePayInstallment(debt)}
                                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-md transition-colors text-xs"
                                                                            >
                                                                                Pagar
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-slate-500 font-medium px-3 py-1.5 text-xs">A Vencer</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                     </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
  }

  const NavItem: React.FC<{ view: View; icon: string; label: string; }> = ({ view, icon, label }) => (
    <button onClick={() => setActiveView(view)}
      className={`flex items-center w-full px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
        activeView === view ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      <Icon name={icon} className="w-5 h-5 mr-4" />
      <span>{label}</span>
    </button>
  );

  const viewTitles: Record<View, string> = {
    dashboard: 'Resumo', transactions: 'Lançamentos', cards: 'Meus Cartões',
    goals: 'Metas', people: 'Pessoas', analysis: 'Análise com IA', accounts: 'Minhas Contas',
    patrimonio: 'Gestão de Patrimônio'
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans">
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700/50 p-6 flex-shrink-0 hidden md:flex flex-col">
        <div className="flex items-center mb-10">
            <Icon name="piggy-bank" className="text-4xl text-indigo-400 mr-3" />
            <h1 className="text-xl font-bold text-white">Meu Financeiro</h1>
        </div>
        <nav className="flex flex-col space-y-3">
            <NavItem view="dashboard" icon="chart-pie" label="Resumo" />
            <NavItem view="transactions" icon="exchange-alt" label="Lançamentos" />
            <NavItem view="cards" icon="credit-card" label="Cartões" />
            <NavItem view="accounts" icon="wallet" label="Contas" />
            <NavItem view="patrimonio" icon="landmark" label="Patrimônio" />
            <NavItem view="goals" icon="bullseye" label="Metas" />
            <NavItem view="people" icon="users" label="Pessoas" />
            <NavItem view="analysis" icon="wand-magic-sparkles" label="Análise IA" />
        </nav>
        <button
          onClick={() => setTxModalOpen(true)}
          className="mt-auto w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center shadow-lg shadow-indigo-600/20"
        >
          <Icon name="plus" className="mr-2" />
          Novo Lançamento
        </button>
      </aside>
      
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
         <header className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-white">{viewTitles[activeView]}</h2>
            <button onClick={() => setAreValuesVisible(prev => !prev)} className="text-slate-400 hover:text-white transition-colors" title={areValuesVisible ? "Ocultar valores" : "Mostrar valores"}>
                <Icon name={areValuesVisible ? "eye" : "eye-slash"} className="text-2xl" />
            </button>
        </header>
        <div className="flex-1">
            {renderView()}
        </div>
      </main>

       {isDatePickerOpen && (
        <CustomDatePicker
          selectedDate={expectationDate ? new Date(expectationDate + 'T12:00:00') : null}
          onChange={(date) => {
            setExpectationDate(date.toISOString().split('T')[0]);
            setDatePickerOpen(false);
          }}
          onClose={() => setDatePickerOpen(false)}
        />
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700 grid grid-cols-5 gap-1 p-1 z-40">
        <button onClick={() => setActiveView('dashboard')} className={`p-2 rounded-lg flex flex-col items-center text-xs ${activeView === 'dashboard' ? 'text-indigo-400' : 'text-slate-400'}`}><Icon name="chart-pie" className="text-xl mb-1" /><span>Resumo</span></button>
        <button onClick={() => setActiveView('transactions')} className={`p-2 rounded-lg flex flex-col items-center text-xs ${activeView === 'transactions' ? 'text-indigo-400' : 'text-slate-400'}`}><Icon name="exchange-alt" className="text-xl mb-1" /><span>Lançar</span></button>
        <button onClick={() => setTxModalOpen(true)} className="p-3 -translate-y-4 bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-600/40"><Icon name="plus" className="text-2xl" /></button>
        <button onClick={() => setActiveView('cards')} className={`p-2 rounded-lg flex flex-col items-center text-xs ${activeView === 'cards' ? 'text-indigo-400' : 'text-slate-400'}`}><Icon name="credit-card" className="text-xl mb-1" /><span>Cartões</span></button>
        <button onClick={() => setActiveView('patrimonio')} className={`p-2 rounded-lg flex flex-col items-center text-xs ${activeView === 'patrimonio' ? 'text-indigo-400' : 'text-slate-400'}`}><Icon name="landmark" className="text-xl mb-1" /><span>Patrimônio</span></button>
      </div>

      <AddTransactionModal 
        isOpen={isTxModalOpen} 
        onClose={closeModals} 
        onAddTransaction={addTransaction}
        onEditTransaction={handleEditTransaction}
        editingTransaction={editingTarget?.type === 'transaction' ? editingTarget.data : null}
        accounts={accounts} categories={categories} costCenters={costCenters} 
      />
      <AddCardModal 
        isOpen={isAddCardModalOpen} 
        onClose={closeModals} 
        onAddCard={addCreditCard}
        onEditCard={handleEditCard}
        editingCard={editingTarget?.type === 'card' ? editingTarget.data : null}
        accounts={accounts}
      />
      <AddCardTransactionModal 
        isOpen={isAddCardTxModalOpen} 
        onClose={closeModals} 
        onAddTransaction={handleAddCardTransaction}
        onEditTransaction={handleEditCardTransaction}
        editingTransaction={editingTarget?.type === 'cardTransaction' ? editingTarget.data : null}
        cards={creditCards} people={people} categories={categories} 
        creditCardTransactions={creditCardTransactions}
        defaultCardId={cardTxModalDefaultId} 
        areValuesVisible={areValuesVisible}
      />
       <ConfirmationModal
        isOpen={!!deletionTarget || isConfirmationModalOpen}
        onClose={() => { setDeletionTarget(null); setConfirmationModalOpen(false); }}
        onConfirm={deletionTarget ? handleDelete : confirmationProps.onConfirm}
        title={deletionTarget ? "Confirmar Exclusão" : confirmationProps.title}
        message={deletionTarget ? "Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita." : confirmationProps.message}
        confirmText={deletionTarget ? "Sim, Excluir" : confirmationProps.confirmText}
        confirmButtonClass={deletionTarget ? '' : confirmationProps.confirmButtonClass}
      />
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={closeModals}
        onAddGoal={addGoal}
        onEditGoal={handleEditGoal}
        editingGoal={editingTarget?.type === 'goal' ? editingTarget.data : null}
      />
      <AddValueModal
        isOpen={isAddValueModalOpen}
        onClose={closeModals}
        onAddValue={addValueToGoal}
        goal={targetGoal}
        accounts={accounts}
      />
      <RecurringTransactionModal
        isOpen={isRecurringTxModalOpen}
        onClose={closeModals}
        onAddTransaction={addRecurringTransaction}
        onEditTransaction={handleEditRecurringTransaction}
        editingTransaction={editingTarget?.type === 'recurringTransaction' ? editingTarget.data : null}
        accounts={accounts}
        categories={categories}
      />
      <InvestmentModal
        isOpen={isInvestmentModalOpen}
        onClose={closeModals}
        onAddInvestment={addInvestment}
        onEditInvestment={handleEditInvestment}
        editingInvestment={editingTarget?.type === 'investment' ? editingTarget.data : null}
      />
       <DebtModal
        isOpen={isDebtModalOpen}
        onClose={closeModals}
        onAddDebt={addDebt}
        onEditDebt={handleEditDebt}
        editingDebt={editingTarget?.type === 'debt' ? editingTarget.data : null}
        accounts={accounts}
      />
       <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={closeModals}
        onImport={handleImportTransactions}
        accounts={accounts}
      />
       <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeModals}
        onTransfer={handleTransfer}
        accounts={accounts}
      />
    </div>
  );
};

export default App;