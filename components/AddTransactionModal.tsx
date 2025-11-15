import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, Account, Category, CostCenter } from '../types';
import Icon from './icons/Icon';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

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
  const [category, setCategory] = useState('');
  const [costCenter, setCostCenter] = useState('');
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
          setDate(editingTransaction.date);
          setAccount(editingTransaction.account);
          setCategory(editingTransaction.category);
          setCostCenter(editingTransaction.costCenter || '');
        } else {
          const initialType = TransactionType.SAIDA;
          setType(initialType);
          setDescription('');
          setAmount('');
          setDate(new Date().toISOString().split('T')[0]);
          setAccount(accounts[0]?.name || '');
          const availableCategories = categories.filter(c => !c.type || c.type === initialType);
          setCategory(availableCategories.find(c => c.name !== 'Salário')?.name || availableCategories[0]?.name || '');
          setCostCenter('');
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
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in-up flex flex-col max-h-[90vh]">
        
        <div className="p-8 pb-0 flex-shrink-0">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <Icon name="xmark" className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">
              {isEditing ? 'Editar Lançamento' : 'Adicionar Lançamento'}
            </h2>
        </div>
        
        <div className="flex-grow overflow-y-auto px-8">
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

            <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-4">
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
                      placeholder="0,00" step="0.01" inputMode="decimal" required />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
                <button type="button" onClick={() => setDatePickerOpen(true)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                >
                  <span>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <Icon name="calendar-days" />
                </button>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                <CustomSelect
                    id="category"
                    value={category}
                    onChange={setCategory}
                    options={filteredCategories.map(c => ({ value: c.name, label: c.name }))}
                />
              </div>
              <div>
                <label htmlFor="account" className="block text-sm font-medium text-slate-300 mb-1">Conta</label>
                <CustomSelect
                    id="account"
                    value={account}
                    onChange={setAccount}
                    options={accounts.map(a => ({ value: a.name, label: a.name }))}
                />
              </div>
              <div>
                <label htmlFor="costCenter" className="block text-sm font-medium text-slate-300 mb-1">Centro de Custo (Opcional)</label>
                <CustomSelect
                    id="costCenter"
                    value={costCenter}
                    onChange={setCostCenter}
                    options={[{ value: '', label: 'Nenhum' }, ...costCenters.map(cc => ({ value: cc.name, label: cc.name }))]}
                />
              </div>
            </form>
        </div>
        
        <div className="p-8 pt-6 flex justify-end space-x-3 flex-shrink-0">
            <button type="button" onClick={onClose}
                    className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">
              Cancelar
            </button>
            <button type="submit" form="add-transaction-form"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              {isEditing ? 'Salvar Alterações' : 'Salvar Lançamento'}
            </button>
        </div>
      </div>
    </div>
    {isDatePickerOpen && (
        <CustomDatePicker
          selectedDate={new Date(date + 'T12:00:00')}
          onChange={newDate => {
            setDate(newDate.toISOString().split('T')[0]);
            setDatePickerOpen(false);
          }}
          onClose={() => setDatePickerOpen(false)}
        />
    )}
    </>
  );
};

export default AddTransactionModal;
