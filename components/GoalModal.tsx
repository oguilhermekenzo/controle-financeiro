import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import Icon from './icons/Icon';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  onEditGoal: (goal: Goal) => void;
  editingGoal: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onAddGoal, onEditGoal, editingGoal }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const isEditing = !!editingGoal;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(editingGoal.name);
        setTargetAmount(String(editingGoal.targetAmount));
      } else {
        setName('');
        setTargetAmount('');
      }
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const goalData = {
      name,
      targetAmount: parseFloat(targetAmount),
    };

    if (isEditing) {
      onEditGoal({ ...editingGoal, ...goalData });
    } else {
      onAddGoal(goalData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Editar Meta' : 'Nova Meta'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-slate-300 mb-1">
              Nome da Meta
            </label>
            <input
              type="text"
              id="goalName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Viagem para o Japão"
              required
            />
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-slate-300 mb-1">
              Valor Alvo (R$)
            </label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="10000,00"
              step="0.01"
              required
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
              className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isEditing ? 'Salvar Alterações' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
