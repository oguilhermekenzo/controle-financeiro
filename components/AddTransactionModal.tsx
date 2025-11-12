import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Account, Category, CostCenter } from '../types';
import Icon from './icons/Icon';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (transaction: Transaction) => void;
  editingTransaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  costCenters: CostCenter[];
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  editingTransaction,
  accounts,
  categories,
  costCenters,
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.SAIDA);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState(accounts[0]?.name || '');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [costCenter, setCostCenter] = useState('');

  const isEditing = !!editingTransaction;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
          setType(editingTransaction.type);
          setDescription(editingTransaction.description);
          setAmount(String(editingTransaction.amount));
          setDate(editingTransaction.date);
          setAccount(editingTransaction.account);
          setCategory(editingTransaction.category);
          setCostCenter(editingTransaction.costCenter || '');
        } else {
          setType(TransactionType.SAIDA);
          setDescription('');
          setAmount('');
          setDate(new Date().toISOString().split('T')[0]);
          setAccount(accounts[0]?.name || '');
          setCategory(categories.find(c => c.name !== 'Salário')?.name || '');
          setCostCenter('');
        }
    }
  }, [editingTransaction, isOpen, accounts, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date || !account || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const transactionData = {
      type,
      description,
      amount: parseFloat(amount),
      date,
      account,
      category,
      costCenter: costCenter || undefined,
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
          {isEditing ? 'Editar Lançamento' : 'Adicionar Lançamento'}
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
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)}
                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   placeholder="Ex: Compras no supermercado" required />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)}
                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                   placeholder="0,00" step="0.01" required />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)}
                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
            <select id="category" value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="account" className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
            <select id="account" value={account} onChange={e => setAccount(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
              {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="costCenter" className="block text-sm font-medium text-slate-300 mb-1">Centro de Custo (Opcional)</label>
            <select id="costCenter" value={costCenter} onChange={e => setCostCenter(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
               <option value="">Nenhum</option>
              {costCenters.map(cc => <option key={cc.id} value={cc.name}>{cc.name}</option>)}
            </select>
          </div>

          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
                    className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">
              Cancelar
            </button>
            <button type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              {isEditing ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;