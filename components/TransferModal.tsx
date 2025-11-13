import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import Icon from './icons/Icon';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (fromAccountId: string, toAccountId: string, amount: number, date: string) => void;
  accounts: Account[];
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onTransfer, accounts }) => {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set initial state when modal opens
      const firstAccount = accounts[0]?.id || '';
      const secondAccount = accounts.find(acc => acc.id !== firstAccount)?.id || '';
      
      setFromAccountId(firstAccount);
      setToAccountId(secondAccount);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setError('');
    }
  }, [isOpen, accounts]);

  if (!isOpen) return null;

  const handleFromAccountChange = (newFromId: string) => {
    setFromAccountId(newFromId);
    // If the new 'from' account is the same as the 'to' account,
    // automatically select a different 'to' account.
    if (newFromId === toAccountId) {
        const newToAccount = accounts.find(acc => acc.id !== newFromId);
        setToAccountId(newToAccount?.id || '');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId || !toAccountId || !amount) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (fromAccountId === toAccountId) {
      setError('A conta de origem e destino não podem ser a mesma.');
      return;
    }
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('O valor da transferência deve ser um número positivo.');
      return;
    }

    onTransfer(fromAccountId, toAccountId, transferAmount, date);
  };

  const availableToAccounts = accounts.filter(acc => acc.id !== fromAccountId);

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Transferência Entre Contas</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fromAccount" className="block text-sm font-medium text-slate-300 mb-1">
              De
            </label>
            <CustomSelect
                id="fromAccount"
                value={fromAccountId}
                onChange={handleFromAccountChange}
                options={accounts.map(acc => ({ value: acc.id, label: acc.name }))}
                placeholder="Selecione a conta de origem..."
            />
          </div>
          <div>
            <label htmlFor="toAccount" className="block text-sm font-medium text-slate-300 mb-1">
              Para
            </label>
            <CustomSelect
                id="toAccount"
                value={toAccountId}
                onChange={setToAccountId}
                options={availableToAccounts.map(acc => ({ value: acc.id, label: acc.name }))}
                placeholder="Selecione a conta de destino..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="transferAmount" className="block text-sm font-medium text-slate-300 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                id="transferAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0,00"
                step="0.01"
                inputMode="decimal"
                required
              />
            </div>
            <div>
                <label htmlFor="transferDate" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
                <button type="button" onClick={() => setDatePickerOpen(true)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                >
                  <span>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <Icon name="calendar-days" />
              </button>
            </div>
          </div>
          {error && <p className="text-rose-400 text-sm">{error}</p>}
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
              className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirmar Transferência
            </button>
          </div>
        </form>
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

export default TransferModal;