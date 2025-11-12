import React, { useState, useEffect } from 'react';
import { RecurringTransaction, TransactionType, RecurringTransactionFrequency, Account, Category } from '../types';
import Icon from './icons/Icon';

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
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [frequency, setFrequency] = useState<RecurringTransactionFrequency>(RecurringTransactionFrequency.MENSAL);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const isEditing = !!editingTransaction;

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
          setType(TransactionType.SAIDA);
          setDescription('');
          setAmount('');
          setAccount(accounts[0]?.name || '');
          setCategory(categories.find(c => c.name !== 'Salário')?.name || '');
          setFrequency(RecurringTransactionFrequency.MENSAL);
          setDayOfMonth('1');
          setStartDate(new Date().toISOString().split('T')[0]);
        }
    }
  }, [editingTransaction, isOpen, accounts, categories]);

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
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="0.01" required />
            </div>
             <div>
                <label htmlFor="rec_category" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                <select id="rec_category" value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
             </div>
             <div className="sm:col-span-2">
                <label htmlFor="rec_account" className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
                <select id="rec_account" value={account} onChange={e => setAccount(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="rec_frequency" className="block text-sm font-medium text-slate-300 mb-1">Frequência</label>
                <select id="rec_frequency" value={frequency} onChange={e => setFrequency(e.target.value as RecurringTransactionFrequency)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                    {Object.values(RecurringTransactionFrequency).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="rec_day" className="block text-sm font-medium text-slate-300 mb-1">Dia do Mês</label>
                <input type="number" id="rec_day" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)}
                      min="1" max="31" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rec_start_date" className="block text-sm font-medium text-slate-300 mb-1">Data de Início</label>
              <input type="date" id="rec_start_date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required/>
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
  );
};

export default RecurringTransactionModal;
