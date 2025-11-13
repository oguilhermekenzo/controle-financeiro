import React, { useState, useEffect } from 'react';
import { Goal, Account } from '../types';
import Icon from './icons/Icon';
import CustomSelect from './CustomSelect';

interface AddValueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddValue: (goalId: string, value: number, accountName: string) => void;
  goal: Goal | null;
  accounts: Account[];
}

const AddValueModal: React.FC<AddValueModalProps> = ({ isOpen, onClose, onAddValue, goal, accounts }) => {
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState(accounts[0]?.name || '');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setAccountName(accounts[0]?.name || '');
    }
  }, [isOpen, accounts]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0 || !accountName) {
      alert('Por favor, insira um valor válido e selecione uma conta.');
      return;
    }
    onAddValue(goal.id, value, accountName);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold text-white mb-2">Adicionar Valor</h2>
        <p className="text-slate-400 mb-6">Meta: <span className="font-semibold text-indigo-400">{goal.name}</span></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="addValueAmount" className="block text-sm font-medium text-slate-300 mb-1">
              Valor a Adicionar (R$)
            </label>
            <input
              type="number"
              id="addValueAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="100,00"
              step="0.01"
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <label htmlFor="sourceAccount" className="block text-sm font-medium text-slate-300 mb-1">
              Debitar da Conta
            </label>
            <CustomSelect
                id="sourceAccount"
                value={accountName}
                onChange={setAccountName}
                options={accounts.map(acc => ({ value: acc.name, label: acc.name }))}
            />
          </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddValueModal;