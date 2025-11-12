import React, { useState, useEffect } from 'react';
import { Debt, Account } from '../types';
import Icon from './icons/Icon';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onEditDebt: (debt: Debt) => void;
  editingDebt: Debt | null;
  accounts: Account[];
}

const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, onAddDebt, onEditDebt, editingDebt, accounts }) => {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfInstallments, setNumberOfInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  
  const isEditing = !!editingDebt;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(editingDebt.name);
        setTotalAmount(String(editingDebt.totalAmount));
        setNumberOfInstallments(String(editingDebt.numberOfInstallments));
        setPaidInstallments(String(editingDebt.paidInstallments));
        setFirstDueDate(editingDebt.firstDueDate);
        setAccountId(editingDebt.accountId);
      } else {
        setName('');
        setTotalAmount('');
        setNumberOfInstallments('');
        setPaidInstallments('0');
        setFirstDueDate(new Date().toISOString().split('T')[0]);
        setAccountId(accounts[0]?.id || '');
      }
    }
  }, [editingDebt, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paid = parseInt(paidInstallments);
    const total = parseInt(numberOfInstallments);

    if (!name || !totalAmount || !numberOfInstallments || !firstDueDate || !accountId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (paid > total) {
      alert('O número de parcelas pagas não pode ser maior que o número total de parcelas.');
      return;
    }

    const debtData = {
      name,
      totalAmount: parseFloat(totalAmount),
      numberOfInstallments: total,
      paidInstallments: paid,
      firstDueDate,
      accountId,
    };

    if (isEditing) {
      onEditDebt({ ...debtData, id: editingDebt.id });
    } else {
      onAddDebt(debtData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Editar Dívida' : 'Nova Dívida'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="sm:col-span-2">
              <label htmlFor="debt_name" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
              <input type="text" id="debt_name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="Ex: Financiamento do Carro" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="debt_total" className="block text-sm font-medium text-slate-300 mb-1">Valor Total (R$)</label>
              <input type="number" id="debt_total" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="0.01" required />
            </div>
            <div>
              <label htmlFor="debt_installments" className="block text-sm font-medium text-slate-300 mb-1">Nº de Parcelas</label>
              <input type="number" id="debt_installments" value={numberOfInstallments} onChange={e => setNumberOfInstallments(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="1" min="1" required />
            </div>
            <div>
              <label htmlFor="debt_paid_installments" className="block text-sm font-medium text-slate-300 mb-1">Parcelas já Pagas</label>
              <input type="number" id="debt_paid_installments" value={paidInstallments} onChange={e => setPaidInstallments(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="1" min="0" required />
            </div>
             <div>
              <label htmlFor="debt_due_date" className="block text-sm font-medium text-slate-300 mb-1">Venc. 1ª Parcela</label>
              <input type="date" id="debt_due_date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
            </div>
          </div>
           <div>
              <label htmlFor="debt_account" className="block text-sm font-medium text-slate-300 mb-1">Debitar da Conta</label>
               <select id="debt_account" value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
          </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditing ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;