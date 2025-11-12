import React, { useState, useEffect, useMemo } from 'react';
import { CreditCardTransaction, CreditCard, Person, Category } from '../types';
import Icon from './icons/Icon';

interface AddCardTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<CreditCardTransaction, 'id' | 'paid'>, installments: number) => void;
  onEditTransaction: (transaction: CreditCardTransaction) => void;
  editingTransaction: CreditCardTransaction | null;
  cards: CreditCard[];
  people: Person[];
  categories: Category[];
  creditCardTransactions: CreditCardTransaction[];
  defaultCardId?: string;
  areValuesVisible: boolean;
}

const AddCardTransactionModal: React.FC<AddCardTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onEditTransaction,
  editingTransaction,
  cards,
  people,
  categories,
  creditCardTransactions,
  defaultCardId,
  areValuesVisible,
}) => {
  const [cardId, setCardId] = useState(defaultCardId || (cards[0]?.id || ''));
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [personId, setPersonId] = useState(people[0]?.id || '');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState('1');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [isUserEditingInstallmentAmount, setIsUserEditingInstallmentAmount] = useState(false);

  const isEditing = !!editingTransaction;
  
  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setCardId(editingTransaction.cardId);
            setDescription(editingTransaction.installmentInfo ? editingTransaction.description.replace(/ \(\d+\/\d+\)$/, '') : editingTransaction.description);
            setAmount(String(editingTransaction.amount));
            setDate(editingTransaction.date);
            setPersonId(editingTransaction.personId || people[0]?.id || '');
            setCategory(editingTransaction.category);
            setNotes(editingTransaction.notes || '');
            setInstallments('1');
            setInstallmentAmount('');
        } else {
            setCardId(defaultCardId || (cards[0]?.id || ''));
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setPersonId(people[0]?.id || '');
            setCategory(categories.find(c => c.name !== 'Salário')?.name || '');
            setNotes('');
            setInstallments('1');
            setInstallmentAmount('');
            setIsUserEditingInstallmentAmount(false);
        }
    }
  }, [editingTransaction, isOpen, defaultCardId, cards, people, categories]);

  useEffect(() => {
    if (isEditing || isUserEditingInstallmentAmount) return;
    const numAmount = parseFloat(amount);
    const numInstallments = parseInt(installments, 10);
    if (!isNaN(numAmount) && numInstallments > 0) {
      setInstallmentAmount((numAmount / numInstallments).toFixed(2));
    } else {
      setInstallmentAmount('');
    }
  }, [amount, installments, isEditing, isUserEditingInstallmentAmount]);
  
  const {
    numAmount, numInstallments, numInstallmentAmount, totalWithInterest, interestAmount, interestPercentage,
  } = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    const numInstallments = parseInt(installments, 10) || 1;
    const numInstallmentAmount = parseFloat(installmentAmount) || 0;
    const totalWithInterest = numInstallmentAmount * numInstallments;
    const interestAmount = numInstallments > 1 ? totalWithInterest - numAmount : 0;
    const interestPercentage = numAmount > 0 && numInstallments > 1 ? (interestAmount / numAmount) * 100 : 0;
    return { numAmount, numInstallments, numInstallmentAmount, totalWithInterest, interestAmount, interestPercentage };
  }, [amount, installments, installmentAmount]);

  if (!isOpen) return null;

  const formatCurrencyLocal = (value: number) => {
    if (areValuesVisible) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return 'R$ ****,**';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId || !description || !amount || !date || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.'); return;
    }

    if (!isEditing) {
        const selectedCard = cards.find(c => c.id === cardId);
        if (!selectedCard) { alert('Cartão selecionado é inválido.'); return; }

        const unpaidTransactionsTotal = creditCardTransactions.filter(t => t.cardId === cardId && !t.paid).reduce((sum, t) => sum + t.amount, 0);
        const availableLimit = selectedCard.limit - unpaidTransactionsTotal;
        const newExpenseTotal = numInstallments > 1 ? totalWithInterest : numAmount;

        if (newExpenseTotal > availableLimit) {
            alert(`Este gasto ultrapassa o limite disponível do seu cartão.\n\nLimite disponível: ${formatCurrencyLocal(availableLimit)}`);
            return;
        }
    }
    
    const finalAmountPerInstallment = numInstallments > 1 ? numInstallmentAmount : numAmount;

    if (isNaN(finalAmountPerInstallment) || finalAmountPerInstallment <= 0) {
      alert('O valor da parcela é inválido.'); return;
    }
    
    const transactionData = { cardId, description, amount: finalAmountPerInstallment, date, personId, category, notes };

    if (isEditing) {
        onEditTransaction({ ...transactionData, id: editingTransaction.id, amount: parseFloat(amount), paid: editingTransaction.paid });
    } else {
        onAddTransaction(transactionData, numInstallments);
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
          {isEditing ? 'Editar Gasto no Cartão' : 'Novo Lançamento'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="sm:col-span-2">
                <label htmlFor="card" className="block text-sm font-medium text-slate-300 mb-1">Cartão *</label>
                <select id="card" value={cardId} onChange={e => setCardId(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="ccDescription" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                <input type="text" id="ccDescription" value={description} onChange={e => setDescription(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="ccAmount" className="block text-sm font-medium text-slate-300 mb-1">Valor (R$) *</label>
                    <input type="number" id="ccAmount" value={amount} onChange={e => { setAmount(e.target.value); setIsUserEditingInstallmentAmount(false);}}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        placeholder="0,00" step="0.01" required disabled={isEditing} />
                </div>
                <div>
                    <label htmlFor="ccDate" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
                    <input type="date" id="ccDate" value={date} onChange={e => setDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required/>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="ccPerson" className="block text-sm font-medium text-slate-300 mb-1">Pessoa *</label>
                    <select id="ccPerson" value={personId} onChange={e => setPersonId(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                    <option value="">Selecione...</option>
                    {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label htmlFor="ccCategory" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                    <select id="ccCategory" value={category} onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required>
                    <option value="">Selecione...</option>
                    {categories.filter(c => c.name !== 'Salário').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
            </div>
            
            {!isEditing && (
              <div className="bg-slate-900/70 p-4 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Parcelamento</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label htmlFor="ccInstallments" className="block text-sm font-medium text-slate-300 mb-1">Nº de Parcelas</label>
                        <input type="number" id="ccInstallments" value={installments} onChange={e => { setInstallments(e.target.value); setIsUserEditingInstallmentAmount(false); }}
                            min="1" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                    </div>
                    <div>
                        <label htmlFor="ccInstallmentAmount" className="block text-sm font-medium text-slate-300 mb-1">Valor da Parcela</label>
                        <input type="number" id="ccInstallmentAmount" value={installmentAmount} 
                              onChange={e => { setInstallmentAmount(e.target.value); setIsUserEditingInstallmentAmount(true); }}
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                              placeholder="0,00" step="0.01" required disabled={numInstallments <= 1} />
                    </div>
                </div>
                 {numInstallments > 1 && (
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2 mt-4 text-sm">
                        <div className="flex justify-between text-slate-400"><span>Valor Original:</span><span className="text-slate-200 font-medium">{formatCurrencyLocal(numAmount)}</span></div>
                        <div className="flex justify-between text-slate-400"><span>Valor com Juros:</span><span className="text-slate-200 font-medium">{formatCurrencyLocal(totalWithInterest)}</span></div>
                        <div className="flex justify-between text-slate-400"><span>Juros:</span><span className={`font-medium ${interestAmount > 0.005 ? 'text-rose-400' : 'text-slate-200'}`}>{formatCurrencyLocal(interestAmount)} ({interestPercentage.toFixed(2).replace('.', ',')}%)</span></div>
                        <div className="border-t border-slate-700 my-2 pt-2">
                           <div className="flex justify-between text-slate-200 font-semibold text-base"><span>{numInstallments}x de:</span><span>{formatCurrencyLocal(numInstallmentAmount)}</span></div>
                        </div>
                    </div>
                )}
              </div>
            )}
            
            <div className="sm:col-span-2">
                <label htmlFor="ccNotes" className="block text-sm font-medium text-slate-300 mb-1">Observações</label>
                <textarea id="ccNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
            </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                {isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCardTransactionModal;