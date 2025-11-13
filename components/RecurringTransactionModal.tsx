import React, { useState, useEffect, useMemo } from 'react';
import { RecurringTransaction, TransactionType, RecurringTransactionFrequency, Account, Category } from '../types';
import Icon from './icons/Icon';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => void;
  onEditTransaction: (transaction: RecurringTransaction) => void;
  editingTransaction: RecurringTransaction | null;
  accounts: Account[];
  categories: Category[];
}

const RecurringTransactionModal: React.FC<RecurringTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  editingTransaction,
  accounts,
  categories,
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.SAIDA);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(accounts[0]?.name || '');
  const [category, setCategory] = useState('');
  const [frequency, setFrequency] = useState<RecurringTransactionFrequency>(RecurringTransactionFrequency.MENSAL);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const isEditing = !!editingTransaction;
  
  const filteredCategories = useMemo(() => {
    return categories.filter(c => !c.type || c.type === type);
  }, [type, categories]);

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
          setType(editingTransaction.type);
          setDescription(editingTransaction.description);
          setAmount(String(editingTransaction.amount));
          setAccount(editingTransaction.account);
          setCategory(editingTransaction.category);
          setFrequency(editingTransaction.frequency);
          setDayOfMonth(String(editingTransaction.dayOfMonth));
          setStartDate(editingTransaction.startDate);
        } else {
          const initialType = TransactionType.SAIDA;
          setType(initialType);
          setDescription('');
          setAmount('');
          setAccount(accounts[0]?.name || '');
          const availableCategories = categories.filter(c => !c.type || c.type === initialType);
          setCategory(availableCategories.find(c => c.name !== 'Salário')?.name || availableCategories[0]?.name || '');
          setFrequency(RecurringTransactionFrequency.MENSAL);
          setDayOfMonth('1');
          setStartDate(new Date().toISOString().split('T')[0]);
        }
    }
  }, [editingTransaction, isOpen, accounts, categories]);

  useEffect(() => {
    if (!isOpen) return;
    if (!filteredCategories.some(c => c.name === category)) {
      setCategory(filteredCategories[0]?.name || '');
    }
  }, [type, isOpen, category, filteredCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !account || !category || !dayOfMonth || !startDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const day = parseInt(dayOfMonth);
    const start = new Date(startDate + 'T12:00:00');
    let nextDueDate = new Date(start.getFullYear(), start.getMonth(), day);
    if (nextDueDate < start) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    const transactionData = {
      type,
      description,
      amount: parseFloat(amount),
      account,
      category,
      frequency,
      dayOfMonth: day,
      startDate,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
    };

    if (isEditing) {
      onEditTransaction({ ...transactionData, id: editingTransaction.id });
    } else {
      onAddTransaction(transactionData);
    }
    
    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">
          {isEditing ? 'Editar Lançamento Recorrente' : 'Novo Lançamento Recorrente'}
        </h2>
        
        <div className="flex mb-6 rounded-lg bg-slate-900 p-1">
          <button 
            onClick={() => setType(TransactionType.SAIDA)}
            className={`w-1/2 py-2.5 rounded-md transition-all duration-300 text-sm font-semibold ${type === TransactionType.SAIDA ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Icon name="arrow-down" className="mr-2"/> Despesa
          </button>
          <button 
            onClick={() => setType(TransactionType.ENTRADA)}
            className={`w-1/2 py-2.5 rounded-md transition-all duration-300 text-sm font-semibold ${type === TransactionType.ENTRADA ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
            <Icon name="arrow-up" className="mr-2"/> Receita
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="rec_description" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
              <input type="text" id="rec_description" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
            </div>
            <div>
              <label htmlFor="rec_amount" className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
              <input type="number" id="rec_amount" value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="0.01" inputMode="decimal" required />
            </div>
             <div>
                <label htmlFor="rec_category" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                <CustomSelect
                    id="rec_category"
                    value={category}
                    onChange={setCategory}
                    options={filteredCategories.map(c => ({ value: c.name, label: c.name }))}
                />
             </div>
             <div className="sm:col-span-2">
                <label htmlFor="rec_account" className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
                <CustomSelect
                    id="rec_account"
                    value={account}
                    onChange={setAccount}
                    options={accounts.map(a => ({ value: a.name, label: a.name }))}
                />
            </div>
            <div>
                <label htmlFor="rec_frequency" className="block text-sm font-medium text-slate-300 mb-1">Frequência</label>
                 <CustomSelect
                    id="rec_frequency"
                    value={frequency}
                    onChange={(val) => setFrequency(val as RecurringTransactionFrequency)}
                    options={Object.values(RecurringTransactionFrequency).map(f => ({ value: f, label: f }))}
                />
            </div>
             <div>
                <label htmlFor="rec_day" className="block text-sm font-medium text-slate-300 mb-1">Dia do Mês</label>
                <input type="number" id="rec_day" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
                      min="1" max="31" inputMode="numeric" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rec_start_date" className="block text-sm font-medium text-slate-300 mb-1">Data de Início</label>
               <button type="button" onClick={() => setDatePickerOpen(true)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                >
                  <span>{new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <Icon name="calendar-days" />
              </button>
            </div>
          </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
                    className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">
              Cancelar
            </button>
            <button type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              {isEditing ? 'Salvar Alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
    {isDatePickerOpen && (
        <CustomDatePicker
          selectedDate={new Date(startDate + 'T12:00:00')}
          onChange={newDate => {
            setStartDate(newDate.toISOString().split('T')[0]);
            setDatePickerOpen(false);
          }}
          onClose={() => setDatePickerOpen(false)}
        />
    )}
    </>
  );
};

export default RecurringTransactionModal;