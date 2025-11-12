import React, { useState, useEffect } from 'react';
import { CreditCard, CardBrand, Bank, Account } from '../types';
import Icon from './icons/Icon';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onEditCard: (card: CreditCard) => void;
  editingCard: CreditCard | null;
  accounts: Account[];
}

const colorOptions = [
    { name: 'Índigo', value: 'from-indigo-500 to-purple-600' },
    { name: 'Laranja', value: 'from-orange-500 to-amber-500' },
    { name: 'Verde', value: 'from-emerald-500 to-green-600' },
    { name: 'Ciano', value: 'from-cyan-500 to-sky-600' },
    { name: 'Rosa', value: 'from-pink-500 to-rose-600' },
    { name: 'Ardósia', value: 'from-slate-500 to-slate-700' },
];

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAddCard, onEditCard, editingCard, accounts }) => {
  const [name, setName] = useState('');
  const [bank, setBank] = useState<Bank>(Bank.NUBANK);
  const [brand, setBrand] = useState<CardBrand>(CardBrand.MASTERCARD);
  const [last4Digits, setLast4Digits] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [color, setColor] = useState(colorOptions[0].value);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  
  const isEditing = !!editingCard;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setName(editingCard.name);
            setBank(editingCard.bank);
            setBrand(editingCard.brand);
            setLast4Digits(editingCard.last4Digits);
            setLimit(String(editingCard.limit));
            setClosingDay(String(editingCard.closingDay));
            setDueDate(String(editingCard.dueDate));
            setColor(editingCard.color);
            setAccountId(editingCard.accountId);
        } else {
            setName('');
            setBank(Bank.NUBANK);
            setBrand(CardBrand.MASTERCARD);
            setLast4Digits('');
            setLimit('');
            setClosingDay('');
            setDueDate('');
            setColor(colorOptions[0].value);
            setAccountId(accounts[0]?.id || '');
        }
    }
  }, [editingCard, isOpen, accounts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !last4Digits || !limit || !closingDay || !dueDate || !accountId) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    const cardData = {
      name,
      bank,
      brand,
      last4Digits,
      limit: parseFloat(limit),
      closingDay: parseInt(closingDay),
      dueDate: parseInt(dueDate),
      color,
      accountId,
    };
    if (isEditing) {
        onEditCard({ ...cardData, id: editingCard.id });
    } else {
        onAddCard(cardData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">
            {isEditing ? 'Editar Cartão' : 'Adicionar Novo Cartão'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                  <label htmlFor="cardName" className="block text-sm font-medium text-slate-300 mb-1">Nome do Cartão *</label>
                  <input type="text" id="cardName" value={name} onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="Ex: Cartão Black" required />
              </div>
              <div>
                  <label htmlFor="cardBank" className="block text-sm font-medium text-slate-300 mb-1">Banco *</label>
                  <select id="cardBank" value={bank} onChange={e => setBank(e.target.value as Bank)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                      {Object.values(Bank).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="cardBrand" className="block text-sm font-medium text-slate-300 mb-1">Bandeira *</label>
                  <select id="cardBrand" value={brand} onChange={e => setBrand(e.target.value as CardBrand)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white">
                      {Object.values(CardBrand).map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
              </div>
               <div className="sm:col-span-2">
                    <label htmlFor="cardAccount" className="block text-sm font-medium text-slate-300 mb-1">Debitar da Conta *</label>
                    <select id="cardAccount" value={accountId} onChange={e => setAccountId(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                        <option value="" disabled>Selecione uma conta...</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
              </div>
              <div>
                  <label htmlFor="cardLast4" className="block text-sm font-medium text-slate-300 mb-1">Últimos 4 dígitos *</label>
                  <input type="text" id="cardLast4" value={last4Digits} onChange={e => setLast4Digits(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
              </div>
              <div>
                  <label htmlFor="cardLimit" className="block text-sm font-medium text-slate-300 mb-1">Limite (R$) *</label>
                  <input type="number" id="cardLimit" value={limit} onChange={e => setLimit(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
              </div>
              <div>
                  <label htmlFor="cardClosingDay" className="block text-sm font-medium text-slate-300 mb-1">Dia do Fechamento *</label>
                  <input type="number" id="cardClosingDay" value={closingDay} onChange={e => setClosingDay(e.target.value)} min="1" max="31"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
              </div>
              <div>
                  <label htmlFor="cardDueDate" className="block text-sm font-medium text-slate-300 mb-1">Dia do Vencimento *</label>
                  <input type="number" id="cardDueDate" value={dueDate} onChange={e => setDueDate(e.target.value)}  min="1" max="31"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
              </div>
          </div>
           <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
              <div className="flex flex-wrap gap-4">
                  {colorOptions.map(c => (
                      <button key={c.value} type="button" onClick={() => setColor(c.value)}
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.value} transition-transform transform hover:scale-110 ${color === c.value ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : ''}`}>
                      </button>
                  ))}
              </div>
          </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
                    className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 font-semibold transition-colors">Cancelar</button>
            <button type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                {isEditing ? 'Salvar Alterações' : 'Salvar Cartão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCardModal;
