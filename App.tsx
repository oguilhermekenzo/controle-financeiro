import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Transaction, TransactionType, Account, Category, CostCenter, Goal, Person, CreditCard, CreditCardTransaction, CardBrand, Bank, RecurringTransaction, RecurringTransactionFrequency, Investment, InvestmentType, Debt } from './types';
import { supabase } from './services/supabaseClient';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import Icon from './components/icons/Icon';
import AddTransactionModal from './components/AddTransactionModal';
import AddCardModal from './components/AddCardModal';
import AddCardTransactionModal from './components/AddCardTransactionModal';
import ConfirmationModal from './components/ConfirmationModal';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import CardBrandLogo from './components/icons/CardBrandLogo';
import GoalModal from './components/GoalModal';
import AddValueModal from './components/AddValueModal';
import BankLogo from './components/icons/BankLogo';
import RecurringTransactionModal from './components/RecurringTransactionModal';
import InvestmentModal from './components/InvestmentModal';
import DebtModal from './components/DebtModal';
import CustomDatePicker from './components/CustomDatePicker';
import TransferModal from './components/TransferModal';
import EmptyState from './components/EmptyState';
import Auth from './components/Auth';


const initialCategoriesData: Omit<Category, 'id'>[] = [
  { name: 'Alimentação', type: 'Saída' }, { name: 'Transporte', type: 'Saída' }, { name: 'Moradia', type: 'Saída' }, { name: 'Lazer', type: 'Saída' }, { name: 'Salário', type: 'Entrada' }, { name: 'Outros' }, { name: 'Assinaturas', type: 'Saída' }, { name: 'Pagamento de Fatura', type: 'Saída' }, { name: 'Aporte em Meta', type: 'Saída' }, { name: 'Importado' }, { name: 'Pagamento de Empréstimo', type: 'Saída' }, { name: 'Transferência' },
];

const seedTestData = async (userId: string) => {
    console.log("Seeding data for test user...");
    // 1. Categories
    const categoriesToSeed = initialCategoriesData.map(c => ({ ...c, user_id: userId }));
    const { data: seededCategories, error: catError } = await supabase.from('categories').insert(categoriesToSeed).select();
    if (catError || !seededCategories) { console.error('Seeding error (categories):', catError); return; }
    
    // 2. Accounts
    const { data: seededAccounts, error: accError } = await supabase.from('accounts').insert([
        { user_id: userId, name: 'Carteira', initial_balance: 150.75 },
        { user_id: userId, name: 'Conta Corrente Inter', initial_balance: 3250.00 },
    ]).select();
    if (accError || !seededAccounts) { console.error('Seeding error (accounts):', accError); return; }
    const carteiraId = seededAccounts.find(a => a.name === 'Carteira')?.id;
    const contaCorrenteId = seededAccounts.find(a => a.name === 'Conta Corrente Inter')?.id;

    // 3. People
    const { data: seededPeople, error: pplError } = await supabase.from('people').insert([
        { user_id: userId, name: 'Maria' },
        { user_id: userId, name: 'João' },
    ]).select();
    if (pplError || !seededPeople) { console.error('Seeding error (people):', pplError); return; }
    const mariaId = seededPeople.find(p => p.name === 'Maria')?.id;

    // 4. Credit Cards
    const { data: seededCards, error: cardError } = await supabase.from('credit_cards').insert([
        { 
            user_id: userId, account_id: contaCorrenteId, name: 'Nubank', bank: 'Nubank',
            brand: 'Mastercard', last_4_digits: '5432', limit: 4000,
            closing_day: 25, due_date: 4, color: 'from-indigo-500 to-purple-600',
        }
    ]).select();
    if (cardError || !seededCards) { console.error('Seeding error (cards):', cardError); return; }
    const nubankCardId = seededCards[0].id;

    // 5. Goals
    await supabase.from('goals').insert([
        { user_id: userId, name: 'Viagem de Férias', target_amount: 8000, current_amount: 1250 },
    ]);

    // 6. Transactions
    const catAlimentacaoId = seededCategories.find(c => c.name === 'Alimentação')?.id;
    const catTransporteId = seededCategories.find(c => c.name === 'Transporte')?.id;
    const catSalarioId = seededCategories.find(c => c.name === 'Salário')?.id;

    await supabase.from('transactions').insert([
        { user_id: userId, account_id: contaCorrenteId, category_id: catSalarioId, type: 'Entrada', description: 'Salário Mensal', amount: 7000, date: new Date(new Date().setDate(5)).toISOString().split('T')[0] },
        { user_id: userId, account_id: carteiraId, category_id: catAlimentacaoId, type: 'Saída', description: 'Almoço Restaurante', amount: 35.50, date: new Date().toISOString().split('T')[0] },
    ]);

    // 7. Credit Card Transactions
    await supabase.from('credit_card_transactions').insert([
        { user_id: userId, card_id: nubankCardId, category_id: catTransporteId, description: 'Uber para o trabalho', amount: 22.80, date: new Date().toISOString().split('T')[0], paid: false },
        { user_id: userId, card_id: nubankCardId, category_id: catAlimentacaoId, person_id: mariaId, description: 'Jantar com Maria', amount: 180.50, date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0], paid: false },
    ]);

    console.log("Seeding complete!");
};


// --- TIPOS ---
type View = 'dashboard' | 'transactions' | 'goals' | 'cards' | 'people' | 'accounts' | 'patrimonio' | 'settings';
type DeletionTarget = { id: string; type: 'transaction' | 'cardTransaction' | 'card' | 'person' | 'goal' | 'account' | 'recurringTransaction' | 'investment' | 'debt'; } | null;
type EditingTarget = { data: any; type: 'transaction' | 'cardTransaction' | 'card' | 'person' | 'goal' | 'account' | 'recurringTransaction' | 'investment' | 'debt'; } | null;

// --- HELPERS ---
const getValidDateForMonth = (year: number, month: number, day: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, daysInMonth);
    return new Date(year, month, validDay, 12, 0, 0);
};

const MainApp: React.FC<{ session: Session }> = ({ session }) => {
  const { user } = session;
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
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);

  const [confirmationProps, setConfirmationProps] = useState({ onConfirm: () => {}, title: '', message: '', confirmText: 'Confirmar', confirmButtonClass: '' });
  
  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditCardTransactions, setCreditCardTransactions] = useState<CreditCardTransaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);

  // Effect to load data from Supabase
  useEffect(() => {
    const loadData = async () => {
        // Step 1: Check if seeding is needed for the test user
        const { count, error: countError } = await supabase.from('accounts').select('*', { count: 'exact', head: true });
        if (countError) {
            console.error("Error counting accounts:", countError);
            return;
        }

        if (user.email === 'teste@teste.com' && count === 0) {
            await seedTestData(user.id);
        }

        // Step 2: Fetch all data in parallel
        const [
            accountsRes, categoriesRes, peopleRes, transactionsRes, 
            goalsRes, creditCardsRes, creditCardTransactionsRes
            // Add other fetches here (recurring, investments, debts) when their tables are ready
        ] = await Promise.all([
            supabase.from('accounts').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('people').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('goals').select('*'),
            supabase.from('credit_cards').select('*'),
            supabase.from('credit_card_transactions').select('*'),
        ]);

        // Step 3: Process and set all state
        const accountsData = accountsRes.data || [];
        const categoriesData = categoriesRes.data || [];
        const peopleData = peopleRes.data || [];

        // Set base data
        setAccounts(accountsData.map(a => ({ id: a.id, name: a.name, initialBalance: a.initial_balance })));
        setCategories(categoriesData.map(c => ({ id: c.id, name: c.name, type: c.type || undefined })));
        setPeople(peopleData.map(p => ({ id: p.id, name: p.name })));
        setGoals(goalsRes.data?.map(g => ({ id: g.id, name: g.name, targetAmount: g.target_amount, currentAmount: g.current_amount })) || []);
        setCreditCards(creditCardsRes.data?.map(c => ({
            id: c.id, name: c.name, bank: c.bank, brand: c.brand, last4Digits: c.last_4_digits,
            limit: c.limit, closingDay: c.closing_day, dueDate: c.due_date, color: c.color, accountId: c.account_id
        })) || []);

        // Set dependent data (with mapping)
        if (transactionsRes.data) {
            const formattedTxs = transactionsRes.data.map(t => ({
                id: t.id,
                type: t.type,
                description: t.description,
                amount: t.amount,
                date: t.date,
                account: accountsData.find(a => a.id === t.account_id)?.name || 'Desconhecida',
                category: categoriesData.find(c => c.id === t.category_id)?.name || 'Desconhecida',
                notes: t.notes,
            }));
            setTransactions(formattedTxs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
         if (creditCardTransactionsRes.data) {
            const formattedCardTxs = creditCardTransactionsRes.data.map(t => ({
                id: t.id, cardId: t.card_id, description: t.description, amount: t.amount, date: t.date,
                personId: t.person_id || undefined,
                category: categoriesData.find(c => c.id === t.category_id)?.name || 'Desconhecida',
                notes: t.notes || undefined,
                paid: t.paid,
                groupId: t.group_id || undefined,
                installmentInfo: t.installment_current && t.installment_total ? { current: t.installment_current, total: t.installment_total } : undefined,
             }));
            setCreditCardTransactions(formattedCardTxs);
        }
    };

    loadData();
}, [session, user]);


  // State for actions
  const [cardTxModalDefaultId, setCardTxModalDefaultId] = useState<string>();
  const [deletionTarget, setDeletionTarget] = useState<DeletionTarget>(null);
  const [editingTarget, setEditingTarget] = useState<EditingTarget>(null);
  const [areValuesVisible, setAreValuesVisible] = useState(true); // TODO: load from user settings later
  const [summaryPeriod, setSummaryPeriod] = useState<'monthly' | 'overall'>('monthly');
  const [targetGoal, setTargetGoal] = useState<Goal | null>(null);
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [expectationDate, setExpectationDate] = useState<string | null>(null);
  const [transactionsSubView, setTransactionsSubView] = useState<'current' | 'recurring'>('current');
  const [patrimonioSubView, setPatrimonioSubView] = useState<'investments' | 'debts'>('investments');
  
  const selectedCardIdRef = useRef<string | null>(creditCards[0]?.id || null);
  const currentCardMonthIndexRef = useRef(0);

  const setSelectedCardId = (id: string | null) => {
    if (selectedCardIdRef.current !== id) {
        currentCardMonthIndexRef.current = 0;
    }
    selectedCardIdRef.current = id;
    forceUpdate({});
  };
  const setCurrentCardMonthIndex = (index: number) => {
      currentCardMonthIndexRef.current = index;
      forceUpdate({});
  };
  
  const [, forceUpdate] = useState({});

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.target instanceof HTMLInputElement && event.target.type === 'number' && document.activeElement === event.target) {
        event.target.blur();
      }
    };
    document.addEventListener('wheel', handleWheel);
    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  
  const nextInstallmentRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  useEffect(() => {
    if (expandedDebtId) {
        const timeoutId = setTimeout(() => {
            const element = nextInstallmentRefs.current.get(expandedDebtId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 350);
        return () => clearTimeout(timeoutId);
    }
  }, [expandedDebtId]);

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
      return accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
    }
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
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
    const totalInitialBalance = accounts.reduce((sum, acc) => sum + Number(acc.initialBalance), 0);
    const overallIncome = transactions.filter(t => t.type === TransactionType.ENTRADA).reduce((sum, t) => sum + t.amount, 0);
    const overallExpenses = transactions.filter(t => t.type === TransactionType.SAIDA).reduce((sum, t) => sum + t.amount, 0);
    return { totalIncome: overallIncome, totalExpenses: overallExpenses, balance: totalInitialBalance + overallIncome - overallExpenses };
  }, [summaryPeriod, monthlyTransactions, transactions, previousMonthBalance, accounts]);

  // TODO: Refactor these functions to use Supabase
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => setTransactions(prev => [{ ...transaction, id: crypto.randomUUID() }, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  const addPerson = (person: Omit<Person, 'id'>) => setPeople(prev => [{ ...person, id: crypto.randomUUID() }, ...prev]);
  const addCreditCard = (card: Omit<CreditCard, 'id'>) => setCreditCards(prev => [{ ...card, id: crypto.randomUUID() }, ...prev]);
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => setGoals(prev => [{ ...goal, id: crypto.randomUUID(), currentAmount: 0 }, ...prev]);
  const addAccount = (account: Omit<Account, 'id'>) => setAccounts(prev => [{ ...account, id: crypto.randomUUID() }, ...prev]);
  const addRecurringTransaction = (rt: Omit<RecurringTransaction, 'id'>) => setRecurringTransactions(prev => [{...rt, id: crypto.randomUUID()}, ...prev]);
  const addInvestment = (inv: Omit<Investment, 'id'>) => setInvestments(prev => [{...inv, id: crypto.randomUUID()}, ...prev]);
  const addDebt = (debt: Omit<Debt, 'id'>) => setDebts(prev => [{...debt, id: crypto.randomUUID()}, ...prev]);

  
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

    const handleAddSplitTransaction = (
        baseTxData: Omit<CreditCardTransaction, 'id' | 'paid' | 'personId' | 'amount'>,
        totalAmount: number,
        peopleToSplit: { id: string | null; name: string }[],
        installments: number
    ) => {
        // 1. Handle new people
        const newPeopleNames = peopleToSplit.filter(p => p.id === null).map(p => p.name);
        const newlyCreatedPeople = newPeopleNames.map(name => ({ id: crypto.randomUUID(), name }));

        if (newlyCreatedPeople.length > 0) {
            setPeople(prev => [...prev, ...newlyCreatedPeople]);
        }

        // 2. Combine all people for this transaction
        const existingPeople = people.filter(p => peopleToSplit.some(sp => sp.id === p.id));
        const allPeopleInSplit = [...existingPeople, ...newlyCreatedPeople];

        if (allPeopleInSplit.length === 0) return;

        // 3. Calculate amounts
        const amountPerPerson = totalAmount / allPeopleInSplit.length;

        // 4. Create all transactions (including installments)
        const allNewTransactions: CreditCardTransaction[] = [];
        const groupId = installments > 1 ? crypto.randomUUID() : undefined;
        const originalDate = new Date(baseTxData.date + 'T12:00:00');

        allPeopleInSplit.forEach(person => {
            for (let i = 0; i < installments; i++) {
                const installmentDate = new Date(originalDate);
                installmentDate.setMonth(originalDate.getMonth() + i);

                let description = baseTxData.description;
                if (installments > 1) {
                    description += ` (${i + 1}/${installments})`;
                }
                description += ` - ${person.name}`;
                
                const finalAmount = installments > 1 ? amountPerPerson / installments : amountPerPerson;

                allNewTransactions.push({
                    ...baseTxData,
                    id: crypto.randomUUID(),
                    personId: person.id,
                    amount: finalAmount,
                    date: installmentDate.toISOString().split('T')[0],
                    description,
                    groupId,
                    installmentInfo: installments > 1 ? { current: i + 1, total: installments } : undefined,
                    paid: false,
                });
            }
        });

        setCreditCardTransactions(prev => [...allNewTransactions, ...prev]);
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
      case 'debt': 
        setDebts(prev => prev.filter(d => d.id !== deletionTarget.id)); 
        nextInstallmentRefs.current.delete(deletionTarget.id);
        break;
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
    setRecurringTxModalOpen(false); setInvestmentModalOpen(false); setDebtModalOpen(false); setTransferModalOpen(false);
    setEditingTarget(null); setTargetGoal(null);
  }

    const accountBalances = useMemo(() => {
        return accounts.map(account => {
            const balance = transactions.reduce((acc, t) => {
                if (t.account === account.name) {
                    return t.type === TransactionType.ENTRADA ? acc + t.amount : acc - t.amount;
                }
                return acc;
            }, Number(account.initialBalance));
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
                    if (card.dueDate < card.closingDay) {
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

  const renderSimpleActiveShape = (props: any) => {
    return <Sector {...props} />;
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'transactions': return <TransactionsView />;
      case 'goals': return <GoalsView />;
      case 'cards': return <CardsView />;
      case 'people': return <PeopleView />;
      case 'accounts': return <AccountsView />;
      case 'patrimonio': return <PatrimonioView />;
      case 'settings': return <SettingsView user={user} />;
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
            }, {} as {[key:string]: number});
        return Object.entries(dataByCategory).map(([name, value]) => ({ name, value }));
    }, [displayTransactions, filteredCreditCardTransactions]);
    
    const hasData = useMemo(() => {
        const totalCardExpenses = filteredCreditCardTransactions.reduce((acc, t) => acc + t.amount, 0);
        return totalIncome > 0 || totalExpenses > 0 || totalCardExpenses > 0;
    }, [totalIncome, totalExpenses, filteredCreditCardTransactions]);

    const COLORS = ['#ef4444', '#10b981', '#ec4899', '#3b82f6', '#8b5cf6', '#f59e0b'];
    const chartTooltipFormatter = (value: number) => areValuesVisible ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : 'R$ ****,**';
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedPieLabel = ({ cx, cy, midAngle, outerRadius, percent, value }: {
        cx?: number;
        cy?: number;
        midAngle?: number;
        outerRadius?: number;
        percent?: number;
        value?: any;
    }) => {
        if (percent === undefined || percent < 0.02 || cx === undefined || cy === undefined || midAngle === undefined || outerRadius === undefined) {
            return null;
        }
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="#ffffff" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                {value}
            </text>
        );
    };

    return (
        <div className="gap-10 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 order-1 sm:order-2">
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-emerald-400 mb-1">Receita</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-rose-400 mb-1">Despesa</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl sm:col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-medium text-indigo-400 mb-1">Saldo Final</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(balance)}</p>
                </div>
            </div>
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 order-2 sm:order-1">
                <div className="flex items-center gap-2">
                    {summaryPeriod === 'monthly' && (
                        <>
                           <button onClick={goToPreviousMonth} disabled={currentMonthIndex >= availableTransactionMonths.length - 1} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-left"/></button>
                            <span className="font-semibold w-28 sm:w-36 text-center capitalize text-sm sm:text-base">{availableTransactionMonths.length > 0 ? currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }) : 'Sem Dados'}</span>
                           <button onClick={goToNextMonth} disabled={currentMonthIndex <= 0} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Icon name="chevron-right"/></button>
                        </>
                    )}
                </div>
                <div className="flex bg-slate-700/80 p-1 rounded-lg">
                    <button onClick={() => setSummaryPeriod('monthly')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${summaryPeriod === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Mensal</button>
                    <button onClick={() => setSummaryPeriod('overall')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${summaryPeriod === 'overall' ? 'bg-indigo-600 text-white' : 'text-slate-300'}`}>Geral</button>
                </div>
            </div>

            <div className="order-3">
              {!hasData ? (
                  <div className="flex flex-col items-center justify-center h-80 bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl text-center">
                      <Icon name="folder-open" className="text-6xl text-slate-600 mb-4" />
                      <h3 className="text-xl font-bold text-white">Sem dados para exibir o dashboard</h3>
                      <p className="text-slate-400 mt-2">Adicione seu primeiro lançamento para começar a ver os gráficos.</p>
                  </div>
              ) : (
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
                                      activeShape={renderSimpleActiveShape}
                                  >
                                      {expenseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip 
                                    formatter={chartTooltipFormatter} 
                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #475569', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#ffffff' }}
                                    cursor={false}
                                  />
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
              )}
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
        <>
            {displayTransactions.length > 0 ? (
                <div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[600px] md:min-w-0">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                    <th className="py-3 px-2 md:px-4 font-medium">Descrição</th>
                                    <th className="py-3 px-2 md:px-4 font-medium">Valor</th>
                                    <th className="py-3 px-2 md:px-4 font-medium">Data</th>
                                    <th className="py-3 px-2 md:px-4 font-medium hidden md:table-cell">Categoria</th>
                                    <th className="py-3 px-2 md:px-4 font-medium hidden md:table-cell">Conta</th>
                                    <th className="py-3 px-2 md:px-4 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTransactions.map(t => (
                                    <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800">
                                        <td className="py-3 px-2 md:p-4 font-medium text-white max-w-28 sm:max-w-xs break-words">{t.description}</td>
                                        <td className={`py-3 px-2 md:p-4 font-bold whitespace-nowrap ${t.type === TransactionType.ENTRADA ? 'text-emerald-400' : 'text-rose-400'}`}> {formatCurrency(t.amount)} </td>
                                        <td className="py-3 px-2 md:p-4 text-slate-300">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC', day: '2-digit', month: '2-digit'})}</td>
                                        <td className="py-3 px-2 md:p-4 text-slate-300 hidden md:table-cell">{t.category}</td>
                                        <td className="py-3 px-2 md:p-4 text-slate-300 hidden md:table-cell">{t.account}</td>
                                        <td className="py-3 px-2 md:p-4">
                                            <div className="flex items-center justify-end gap-x-3 sm:gap-x-4">
                                                <button onClick={() => openEditModal(t, 'transaction')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                                                <button onClick={() => { setDeletionTarget({ id: t.id, type: 'transaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState 
                    icon="exchange-alt" 
                    title="Nenhum Lançamento" 
                    message="Ainda não há lançamentos para o período selecionado. Adicione um novo para começar." 
                />
            )}
        </>
       ) : (
        <>
            {recurringTransactions.length > 0 ? (
                <div>
                     <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
                                <th className="py-3 px-2 md:px-4 font-medium">Descrição</th>
                                <th className="py-3 px-2 md:px-4 font-medium">Valor</th>
                                <th className="py-3 px-2 md:px-4 hidden md:table-cell font-medium">Frequência</th>
                                <th className="py-3 px-2 md:px-4 hidden lg:table-cell font-medium">Próximo Vencimento</th>
                                <th className="py-3 px-2 md:px-4 hidden lg:table-cell font-medium">Conta</th>
                                <th className="py-3 px-2 md:px-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recurringTransactions.map(rt => (
                                 <tr key={rt.id} className="border-b border-slate-800 hover:bg-slate-800">
                                   <td className="py-3 md:py-4 px-2 md:px-4 font-medium text-white max-w-28 sm:max-w-xs break-words">{rt.description}</td>
                                   <td className={`py-3 md:py-4 px-2 md:px-4 font-bold whitespace-nowrap ${rt.type === TransactionType.ENTRADA ? 'text-emerald-400' : 'text-rose-400'}`}> {formatCurrency(rt.amount)} </td>
                                   <td className="py-3 md:py-4 px-2 md:px-4 text-slate-300 hidden md:table-cell">{rt.frequency}</td>
                                   <td className="py-3 md:py-4 px-2 md:px-4 text-slate-300 hidden lg:table-cell">{new Date(rt.nextDueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                   <td className="py-3 md:py-4 px-2 md:px-4 text-slate-300 hidden lg:table-cell">{rt.account}</td>
                                   <td className="py-3 md:py-4 px-2 md:px-4">
                                       <div className="flex items-center justify-end gap-3">
                                           <button onClick={() => openEditModal(rt, 'recurringTransaction')} className="text-slate-400 hover:text-indigo-400 transition-colors"><Icon name="pencil"/></button>
                                           <button onClick={() => { setDeletionTarget({ id: rt.id, type: 'recurringTransaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors"><Icon name="trash"/></button>
                                       </div>
                                   </td>
                               </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState 
                    icon="calendar-days" 
                    title="Nenhum Lançamento Recorrente" 
                    message="Você ainda não cadastrou nenhuma despesa ou receita recorrente." 
                />
            )}
        </>
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
       {goals.length > 0 ? (
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
       ) : (
            <EmptyState 
                icon="bullseye" 
                title="Nenhuma Meta Cadastrada" 
                message="Crie sua primeira meta de economia para acompanhar seu progresso." 
            />
       )}
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
                    <input type="number" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} placeholder="Saldo inicial (R$)" step="0.01" inputMode="decimal"
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

            {projectedBalances.length > 0 ? (
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
            ) : (
                <EmptyState
                    icon="wallet"
                    title="Nenhuma Conta Cadastrada"
                    message="Adicione sua primeira conta bancária ou carteira para começar a organizar suas finanças."
                />
            )}
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
                      className="flex-grow min-w-0 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
               <button type="submit" className="bg-indigo-600 text-white font-semibold px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                {editingTarget && editingTarget.type === 'person' ? 'Salvar' : 'Adicionar'}
               </button>
               {editingTarget && editingTarget.type === 'person' && (
                <button type="button" onClick={() => setEditingTarget(null)} className="bg-slate-600 text-white px-5 py-2 rounded-lg hover:bg-slate-500 transition-colors">
                    Cancelar
                </button>
               )}
           </form>
            {people.length > 0 ? (
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
            ) : (
                <EmptyState
                    icon="users"
                    title="Nenhuma Pessoa Cadastrada"
                    message="Adicione pessoas para dividir despesas no cartão de crédito e organizar os gastos."
                />
            )}
        </div>
      );
  }

  const CardsView = () => {
    const selectedCardId = selectedCardIdRef.current;
    const currentCardMonthIndex = currentCardMonthIndexRef.current;

    const availableMonthsForSelectedCard = useMemo(() => {
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
        
        const sortedMonths = Array.from(months)
            .map(m => new Date(m + '-02T12:00:00'))
            .sort((a, b) => b.getTime() - a.getTime());

        if (currentCardMonthIndexRef.current >= sortedMonths.length && sortedMonths.length > 0) {
           currentCardMonthIndexRef.current = 0;
        }

        return sortedMonths;
    }, [selectedCardId, creditCardTransactions, creditCards]);

    const statementDate = availableMonthsForSelectedCard[currentCardMonthIndex] || new Date();
    const selectedCard = creditCards.find(c => c.id === selectedCardId);

    const { statementClosingDate, statementDueDate } = useMemo(() => {
        if (!selectedCard) {
            return { statementClosingDate: null, statementDueDate: null };
        }
        const year = statementDate.getFullYear();
        const month = statementDate.getMonth();
        
        const dueDate = getValidDateForMonth(year, month, selectedCard.dueDate);
        
        let closingDateYear = year;
        let closingDateMonth = month;
        if (selectedCard.dueDate < selectedCard.closingDay) {
            closingDateMonth -= 1;
            if (closingDateMonth < 0) {
                closingDateMonth = 11;
                closingDateYear -= 1;
            }
        }
        const closingDate = getValidDateForMonth(closingDateYear, closingDateMonth, selectedCard.closingDay);

        return { statementClosingDate: closingDate, statementDueDate: dueDate };
    }, [selectedCard, statementDate]);

    const { statementTransactions, total, totalByPerson, isStatementPaid } = useMemo(() => {
        if (!selectedCard) {
            return { statementTransactions: [], total: 0, totalByPerson: [], isStatementPaid: false };
        }

        const statementYear = statementDate.getFullYear();
        const statementMonth = statementDate.getMonth();

        const filtered = creditCardTransactions.filter(t => {
            if (t.cardId !== selectedCard.id) return false;

            const txDate = new Date(t.date + 'T12:00:00');
            let txStatementYear = txDate.getFullYear();
            let txStatementMonth = txDate.getMonth();

            // Logic to determine which statement the transaction belongs to
            if (txDate.getDate() > selectedCard.closingDay) {
                txStatementMonth += 1;
                if (txStatementMonth > 11) {
                    txStatementMonth = 0;
                    txStatementYear += 1;
                }
            }
            
            return txStatementYear === statementYear && txStatementMonth === statementMonth;
        });

        const byPerson = filtered.reduce((acc, t) => {
            if (t.personId) {
                const personName = people.find(p => p.id === t.personId)?.name || 'Não especificado';
                acc[personName] = (acc[personName] || 0) + t.amount;
            } else {
                 const ownerName = 'Você';
                 acc[ownerName] = (acc[ownerName] || 0) + t.amount;
            }
            return acc;
        }, {} as {[key: string]: number});

        return {
            statementTransactions: filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            total: filtered.reduce((sum, t) => sum + t.amount, 0),
            totalByPerson: Object.entries(byPerson).map(([name, amount]) => ({ name, amount })),
            isStatementPaid: filtered.length > 0 && filtered.every(t => t.paid),
        };
    }, [selectedCard, statementDate, creditCardTransactions, people]);


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

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Meus Cartões</h2>
                <button onClick={() => setAddCardModalOpen(true)} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-300 flex items-center shadow-lg shadow-indigo-600/30">
                    <Icon name="plus" className="mr-2"/> Novo Cartão
                </button>
            </div>

            {creditCards.length > 0 ? (
                <>
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
                                        <button onClick={() => setCurrentCardMonthIndex(Math.min(currentCardMonthIndex + 1, availableMonthsForSelectedCard.length - 1))} disabled={currentCardMonthIndex >= availableMonthsForSelectedCard.length - 1} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Icon name="chevron-left"/></button>
                                        <span className="font-semibold w-36 text-center capitalize">{availableMonthsForSelectedCard.length > 0 ? statementDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Sem Faturas'}</span>
                                        <button onClick={() => setCurrentCardMonthIndex(Math.max(currentCardMonthIndex - 1, 0))} disabled={currentCardMonthIndex <= 0} className="p-2 bg-slate-700 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><Icon name="chevron-right"/></button>
                                    </div>
                               </div>
                               <div className="text-left sm:text-right">
                                    <p className="text-slate-300">Total da Fatura: <span className={`font-bold text-3xl ${isStatementPaid ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(total)}</span></p>
                                    <p className="text-sm text-slate-400">Fecha em: {statementClosingDate?.getDate()}/{statementClosingDate && statementClosingDate.getMonth() + 1} | Vence em: {statementDueDate?.getDate()}/{statementDueDate && statementDueDate.getMonth() + 1}</p>
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
                                            <div className="flex items-center gap-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(t, 'cardTransaction')} className="text-slate-400 hover:text-indigo-400 transition-colors" disabled={t.paid}><Icon name="pencil"/></button>
                                                <button onClick={() => { setDeletionTarget({ id: t.id, type: 'cardTransaction' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400 transition-colors" disabled={t.paid}><Icon name="trash"/></button>
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-slate-400 py-6">Nenhum lançamento nesta fatura.</p>}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                    <EmptyState
                        icon="credit-card"
                        title="Nenhum Cartão Cadastrado"
                        message="Adicione seu primeiro cartão de crédito para começar a registrar e acompanhar seus gastos."
                    />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-cyan-400 mb-1">Total Investido</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(totalInvestments)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-amber-400 mb-1">Total Dívidas</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(totalDebts)}</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-sm font-medium text-violet-400 mb-1">Patrimônio Líquido</h3>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white">{formatCurrency(netWorth)}</p>
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
                    <>
                        {investments.length > 0 ? (
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
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button onClick={() => openEditModal(inv, 'investment')} className="text-slate-400 hover:text-indigo-400"><Icon name="pencil"/></button>
                                                        <button onClick={() => { setDeletionTarget({ id: inv.id, type: 'investment' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400"><Icon name="trash"/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon="arrow-trend-up"
                                title="Nenhum Investimento Adicionado"
                                message="Cadastre seus investimentos para acompanhar a evolução do seu patrimônio."
                            />
                        )}
                    </>
                ) : (
                    <>
                        {debts.length > 0 ? (
                            <div className="space-y-4">
                                {debts.map(debt => {
                                    const installmentAmount = debt.totalAmount / debt.numberOfInstallments;
                                    const remainingAmount = installmentAmount * (debt.numberOfInstallments - debt.paidInstallments);
                                    const progress = (debt.paidInstallments / debt.numberOfInstallments) * 100;
                                    const isExpanded = expandedDebtId === debt.id;

                                    return (
                                        <div key={debt.id} className="bg-slate-800 rounded-xl border border-slate-700/80 overflow-hidden transition-all duration-300">
                                            <div 
                                                className="p-4 cursor-pointer hover:bg-slate-700/50"
                                                onClick={() => setExpandedDebtId(isExpanded ? null : debt.id)}
                                            >
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="w-4 transition-transform flex-shrink-0 text-slate-400" />
                                                        <h3 className="font-bold text-white truncate flex-1">{debt.name}</h3>
                                                    </div>
                                                    <div className="flex gap-3 flex-shrink-0">
                                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(debt, 'debt'); }} className="text-slate-400 hover:text-indigo-400"><Icon name="pencil"/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeletionTarget({ id: debt.id, type: 'debt' }); setConfirmationModalOpen(true); }} className="text-slate-400 hover:text-rose-400"><Icon name="trash"/></button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-end mt-3">
                                                    <div>
                                                        <p className="text-xs text-slate-400">Saldo Devedor</p>
                                                        <p className="font-bold text-amber-300 text-xl">{formatCurrency(remainingAmount)}</p>
                                                    </div>
                                                    <span className="text-sm bg-slate-900/80 text-slate-300 px-2.5 py-1 rounded-full font-medium">{debt.paidInstallments}/{debt.numberOfInstallments}</span>
                                                </div>

                                                <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                                                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="bg-slate-900/70 p-4 border-t border-slate-700/80 animate-fade-in-up" style={{animationDuration: '300ms'}}>
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
                                                                <div 
                                                                    key={i} 
                                                                    // FIX: The ref callback function must not return a value. 
                                                                    // The `set` method on a Map returns the map itself, which was causing a type error.
                                                                    // Wrapping the call in curly braces makes the function implicitly return undefined.
                                                                    ref={isNext ? (el) => { nextInstallmentRefs.current.set(debt.id, el); } : null}
                                                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-slate-800 p-2.5 rounded-lg text-sm"
                                                                >
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
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <EmptyState
                                icon="file-invoice-dollar"
                                title="Nenhuma Dívida Adicionada"
                                message="Cadastre seus empréstimos e financiamentos para ter um controle completo."
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
  }
  
  const SettingsView: React.FC<{ user: SupabaseUser }> = ({ user }) => {
    const [name, setName] = useState(user.user_metadata.full_name || '');
    const [email] = useState(user.email || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
        if (error) {
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
        } else {
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!'});
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }
        
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao alterar a senha.' });
        } else {
            setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
            setNewPassword('');
            setConfirmNewPassword('');
        }
        setTimeout(() => setMessage(null), 3000);
    };
    
    // TODO: Implement user settings for privacy
    const handlePrivacyChange = () => {};
    
    const handleDeleteAccount = () => {
        alert("A exclusão de conta deve ser implementada com uma função de servidor por segurança.");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 text-slate-300">
            {message && (
                <div className={`p-4 rounded-lg text-center font-semibold animate-fade-in-up ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {message.text}
                </div>
            )}

            {/* Perfil */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Perfil</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">Nome</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" id="email" value={email} disabled className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed" />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Salvar Alterações</button>
                    </div>
                </form>
            </div>

            {/* Segurança */}
             <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Alterar Senha</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="newPassword">Nova Senha</label>
                            <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword">Confirmar Nova Senha</label>
                            <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                        </div>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">Alterar Senha</button>
                    </div>
                </form>
            </div>
            
            {/* Privacidade */}
            <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Privacidade</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium text-white">Ocultar valores por padrão</p>
                        <p className="text-sm text-slate-400">Os valores monetários serão ofuscados ao abrir o app.</p>
                    </div>
                    <button onClick={handlePrivacyChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors bg-slate-600`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform translate-x-1`} />
                    </button>
                </div>
            </div>

            {/* Gerenciamento da Conta */}
            <div className="bg-rose-900/30 border border-rose-500/30 p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-rose-300 mb-2">Zona de Perigo</h3>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-medium text-white">Excluir conta</p>
                        <p className="text-sm text-rose-300/80">Esta ação é irreversível e todos os seus dados serão perdidos.</p>
                    </div>
                    <button onClick={handleDeleteAccount} disabled className="px-5 py-2.5 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition-colors disabled:bg-rose-800/50 disabled:cursor-not-allowed">Excluir Conta</button>
                </div>
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
    goals: 'Metas', people: 'Pessoas', accounts: 'Minhas Contas',
    patrimonio: 'Gestão de Patrimônio', settings: 'Configurações'
  };

  const moreMenuViews: View[] = ['patrimonio', 'accounts', 'goals', 'people', 'settings'];

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
        </nav>
        <div className="mt-auto space-y-3">
          <button onClick={() => setActiveView('settings')} className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors">
            <Icon name="cog" className="w-5 h-5 mr-4" /> <span>Configurações</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors">
            <Icon name="right-from-bracket" className="w-5 h-5 mr-4" /> <span>Sair</span>
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
         <header className="flex justify-between items-center mb-4">
            <div>
                <h2 className="text-3xl font-bold text-white">{viewTitles[activeView]}</h2>
                {activeView === 'dashboard' && <p className="text-slate-400">Bem-vindo(a) de volta, {user.user_metadata.full_name || user.email}!</p>}
            </div>
            {activeView !== 'people' && (
              <button onClick={() => setAreValuesVisible(prev => !prev)} className="text-slate-400 hover:text-white transition-colors" title={areValuesVisible ? "Ocultar valores" : "Mostrar valores"}>
                  <Icon name={areValuesVisible ? "eye" : "eye-slash"} className="text-2xl" />
              </button>
            )}
        </header>
        <div className="flex-1 pb-20 md:pb-0">
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
        <button onClick={() => setMoreMenuOpen(true)} className={`p-2 rounded-lg flex flex-col items-center text-xs ${moreMenuViews.includes(activeView) ? 'text-indigo-400' : 'text-slate-400'}`}><Icon name="ellipsis" className="text-xl mb-1" /><span>Mais</span></button>
      </div>
      
      {isMoreMenuOpen && (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMoreMenuOpen(false)}></div>
            <div className="fixed bottom-20 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-lg w-56 p-2 z-50 animate-fade-in-up md:hidden" style={{ animationDuration: '200ms' }}>
                <ul className="space-y-1">
                    {[
                      { view: 'patrimonio', icon: 'landmark', label: 'Patrimônio' },
                      { view: 'accounts', icon: 'wallet', label: 'Contas' },
                      { view: 'goals', icon: 'bullseye', label: 'Metas' },
                      { view: 'people', icon: 'users', label: 'Pessoas' },
                      { view: 'settings', icon: 'cog', label: 'Configurações' },
                    ].map(item => (
                        <li key={item.view}>
                            <button 
                                onClick={() => { setActiveView(item.view as View); setMoreMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${activeView === item.view ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            >
                                <Icon name={item.icon} className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        </li>
                    ))}
                     <li><hr className="border-slate-700 my-1"/></li>
                     <li>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md text-rose-400 hover:bg-rose-500/20">
                            <Icon name="right-from-bracket" className="w-5 h-5" />
                            <span>Sair</span>
                        </button>
                     </li>
                </ul>
            </div>
        </>
      )}

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
        onAddSplitTransaction={handleAddSplitTransaction}
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
       <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeModals}
        onTransfer={handleTransfer}
        accounts={accounts}
      />
    </div>
  );
};


const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Icon name="spinner" className="text-4xl text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <Auth />;
    }

    return <MainApp key={session.user.id} session={session} />;
};


export default App;