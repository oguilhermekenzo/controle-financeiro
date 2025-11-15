import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CreditCardTransaction, CreditCard, Person, Category, TransactionType } from '../types';
import Icon from './icons/Icon';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

interface AddCardTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<CreditCardTransaction, 'id' | 'paid'>, installments: number) => void;
  onAddSplitTransaction: (
    baseTxData: Omit<CreditCardTransaction, 'id' | 'paid' | 'personId' | 'amount'>, 
    totalAmount: number, 
    people: {id: string | null, name: string}[],
    installments: number
  ) => void;
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
  onAddSplitTransaction,
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
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState('1');
  const [installmentValue, setInstallmentValue] = useState('');
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  // State for splitting expense
  const [isSplit, setIsSplit] = useState(false);
  const [splitWith, setSplitWith] = useState<{id: string | null, name: string}[]>([]);
  const [personSearch, setPersonSearch] = useState('');
  const [isPersonSearchOpen, setIsPersonSearchOpen] = useState(false);
  const personSearchRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editingTransaction;
  
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type !== TransactionType.ENTRADA);
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setCardId(editingTransaction.cardId);
            setDescription(editingTransaction.installmentInfo ? editingTransaction.description.replace(/ \(\d+\/\d+\)$/, '') : editingTransaction.description);
            setAmount(String(editingTransaction.amount * (editingTransaction.installmentInfo?.total || 1)));
            setDate(editingTransaction.date);
            setPersonId(editingTransaction.personId || people[0]?.id || '');
            setCategory(editingTransaction.category);
            setNotes(editingTransaction.notes || '');
            setInstallments(String(editingTransaction.installmentInfo?.total || 1));
            setIsSplit(false); // Disable splitting on edit
        } else {
            setCardId(defaultCardId || (cards[0]?.id || ''));
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            setPersonId(people[0]?.id || '');
            setCategory(filteredCategories[0]?.name || '');
            setNotes('');
            setInstallments('1');
            setInstallmentValue('');
            setIsSplit(false);
            setSplitWith([]);
            setPersonSearch('');
        }
    }
  }, [editingTransaction, isOpen, defaultCardId, cards, people, filteredCategories]);
  
    useEffect(() => {
        const numAmount = parseFloat(amount);
        const numInstallments = parseInt(installments, 10);
        if (!isEditing && !isSplit && !isNaN(numAmount) && numAmount > 0 && !isNaN(numInstallments) && numInstallments > 0) {
            const calculatedValue = (numAmount / numInstallments).toFixed(2);
            setInstallmentValue(calculatedValue);
        } else {
             setInstallmentValue('');
        }
    }, [amount, installments, isEditing, isSplit]);

    useEffect(() => {
        if (!isEditing) {
            if (isSplit) {
                const initialPerson = people.find(p => p.id === personId);
                if (initialPerson && !splitWith.some(p => p.id === initialPerson.id)) {
                    setSplitWith([initialPerson]);
                } else if (splitWith.length === 0 && people.length > 0) {
                     setSplitWith([people[0]]);
                }
            } else {
                setSplitWith([]);
            }
        }
    }, [isSplit, isEditing, personId, people]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (personSearchRef.current && !personSearchRef.current.contains(event.target as Node)) {
                setIsPersonSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const availablePeopleToSplit = useMemo(() => {
        return people.filter(p => !splitWith.some(sp => sp.id === p.id));
    }, [people, splitWith]);

    const filteredAvailablePeople = useMemo(() => {
        if (!personSearch) return [];
        return availablePeopleToSplit.filter(p => p.name.toLowerCase().includes(personSearch.toLowerCase()));
    }, [personSearch, availablePeopleToSplit]);

    const isNewPerson = useMemo(() => {
        return personSearch.trim() !== '' && !people.some(p => p.name.trim().toLowerCase() === personSearch.trim().toLowerCase());
    }, [personSearch, people]);


    const handleAddPersonToSplit = (person: Person) => {
        setSplitWith(prev => [...prev, person]);
        setPersonSearch('');
        setIsPersonSearchOpen(false);
    };

    const handleCreateAndAddPerson = () => {
        if (!isNewPerson) return;
        setSplitWith(prev => [...prev, { id: null, name: personSearch.trim() }]);
        setPersonSearch('');
        setIsPersonSearchOpen(false);
    };

    const handleRemovePersonFromSplit = (personToRemove: {id: string | null, name: string}) => {
        setSplitWith(prev => prev.filter(p => p.name !== personToRemove.name));
    };
    
    const handlePersonSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const canAddPerson = isNewPerson || filteredAvailablePeople.length === 1;

        if (e.key === 'Enter') {
            if (canAddPerson) {
                e.preventDefault(); // Prevent form submission only when we are adding a person.
                if (isNewPerson) {
                    handleCreateAndAddPerson();
                } else {
                    handleAddPersonToSplit(filteredAvailablePeople[0]);
                }
            }
        }
    };


  if (!isOpen) return null;

  const formatCurrencyLocal = (value: number) => {
    if (areValuesVisible) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return 'R$ ****,**';
  }

  const numInstallments = parseInt(installments, 10) || 1;
  const numAmount = parseFloat(amount) || 0;
  const numInstallmentValue = parseFloat(installmentValue) || 0;
  
  const showInstallmentDetails = !isEditing && !isSplit && numInstallments > 1;
  
  const totalWithInterest = showInstallmentDetails ? numInstallmentValue * numInstallments : numAmount;
  const interestAmount = showInstallmentDetails ? totalWithInterest - numAmount : 0;
  const interestPercentage = numAmount > 0 ? (interestAmount / numAmount) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardId || !description || !amount || !date || !category) {
      alert('Por favor, preencha todos os campos obrigatórios.'); return;
    }

    const finalTotalAmount = parseFloat(amount);
    if (isNaN(finalTotalAmount) || finalTotalAmount <= 0) {
        alert('O valor total do gasto é inválido.'); return;
    }
    
    // Check available limit
    const selectedCard = cards.find(c => c.id === cardId);
    if (!selectedCard) { alert('Cartão selecionado é inválido.'); return; }
    const unpaidTransactionsTotal = creditCardTransactions.filter(t => t.cardId === cardId && !t.paid).reduce((sum, t) => sum + t.amount, 0);
    const availableLimit = selectedCard.limit - unpaidTransactionsTotal;
    
    const commitmentAmount = showInstallmentDetails ? totalWithInterest : finalTotalAmount;

    if (commitmentAmount > availableLimit) {
        alert(`Este gasto de ${formatCurrencyLocal(commitmentAmount)} ultrapassa o limite disponível do seu cartão.\n\nLimite disponível: ${formatCurrencyLocal(availableLimit)}`);
        return;
    }

    if (isSplit && !isEditing) {
        if (splitWith.length < 1) {
            alert('Adicione pelo menos uma pessoa para dividir o gasto.');
            return;
        }
        const transactionData = { cardId, description, date, category, notes: notes || undefined };
        onAddSplitTransaction(transactionData, finalTotalAmount, splitWith, numInstallments);
    } else {
        const singleInstallmentAmount = showInstallmentDetails ? numInstallmentValue : finalTotalAmount / numInstallments;
        const transactionData = { cardId, description, amount: singleInstallmentAmount, date, personId, category, notes: notes || undefined };

        if (isEditing) {
            const originalTotalAmount = parseFloat(amount);
            const editedTxData = {
              ...editingTransaction, 
              cardId, 
              description, 
              amount: originalTotalAmount,
              date, 
              personId, 
              category, 
              notes: notes || undefined
            };
            onEditTransaction(editedTxData);
        } else {
            onAddTransaction(transactionData, numInstallments);
        }
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
            {isEditing ? 'Editar Gasto no Cartão' : 'Novo Lançamento'}
          </h2>
        </div>
        
        <div className="flex-grow overflow-y-auto px-8">
          <form id="card-tx-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="sm:col-span-2">
                  <label htmlFor="card" className="block text-sm font-medium text-slate-300 mb-1">Cartão *</label>
                  <CustomSelect
                    id="card"
                    value={cardId}
                    onChange={setCardId}
                    options={cards.map(c => ({ value: c.id, label: c.name }))}
                  />
              </div>
              <div className="sm:col-span-2">
                  <label htmlFor="ccDescription" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
                  <input type="text" id="ccDescription" value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="ccAmount" className="block text-sm font-medium text-slate-300 mb-1">Valor {isEditing ? '' : 'Total'} (R$) *</label>
                      <input type="number" id="ccAmount" value={amount} onChange={e => setAmount(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                          placeholder="0,00" step="0.01" inputMode="decimal" required disabled={isEditing && !!editingTransaction.installmentInfo} />
                  </div>
                  <div>
                      <label htmlFor="ccDate" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
                      <button type="button" onClick={() => setDatePickerOpen(true)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                      >
                          <span>{new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                          <Icon name="calendar-days" />
                      </button>
                  </div>
              </div>
               <div>
                  <label htmlFor="ccCategory" className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
                  <CustomSelect
                    id="ccCategory"
                    value={category}
                    onChange={setCategory}
                    placeholder="Selecione..."
                    options={filteredCategories.map(c => ({ value: c.name, label: c.name }))}
                  />
              </div>
              
              {!isEditing && (
                <label htmlFor="split-checkbox" className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors">
                    <input 
                        id="split-checkbox" 
                        type="checkbox" 
                        checked={isSplit} 
                        onChange={e => setIsSplit(e.target.checked)} 
                        className="sr-only" 
                    />
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ease-in-out ${
                        isSplit 
                        ? 'bg-indigo-600 border-indigo-500' 
                        : 'bg-slate-700 border-slate-600'
                    }`}>
                        <Icon name="check" className={`text-white h-3 w-3 transition-opacity duration-200 ${isSplit ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <span className="text-sm font-medium text-slate-200 select-none">Dividir Gasto?</span>
                </label>
              )}

              {isSplit && !isEditing ? (
                <div className="bg-slate-900/70 p-4 rounded-xl space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Pessoas na Divisão</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {splitWith.map(p => (
                                <div key={p.name} className="flex items-center gap-2 bg-indigo-500/50 text-indigo-200 text-sm font-medium px-2.5 py-1 rounded-full">
                                    <span>{p.name}</span>
                                    <button type="button" onClick={() => handleRemovePersonFromSplit(p)} className="text-indigo-200 hover:text-white">
                                        <Icon name="xmark" className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="relative" ref={personSearchRef}>
                            <input
                                type="text"
                                value={personSearch}
                                onChange={e => setPersonSearch(e.target.value)}
                                onFocus={() => setIsPersonSearchOpen(true)}
                                onKeyDown={handlePersonSearchKeyDown}
                                placeholder="Adicionar pessoa..."
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                            />
                            {isPersonSearchOpen && (filteredAvailablePeople.length > 0 || isNewPerson) && (
                                <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {filteredAvailablePeople.map(p => (
                                        <button key={p.id} type="button" onClick={() => handleAddPersonToSplit(p)} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700">
                                            {p.name}
                                        </button>
                                    ))}
                                    {isNewPerson && (
                                        <button type="button" onClick={handleCreateAndAddPerson} className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700 flex items-center gap-2">
                                            <Icon name="plus-circle" /> Criar e adicionar "{personSearch.trim()}"
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {splitWith.length > 0 && parseFloat(amount) > 0 && (
                        <div className="text-center bg-slate-800 p-3 rounded-lg">
                            <span className="text-slate-300">{formatCurrencyLocal(parseFloat(amount))} / {splitWith.length} pessoas = </span>
                            <span className="font-bold text-lg text-emerald-400">{formatCurrencyLocal(parseFloat(amount) / splitWith.length)}</span>
                            <span className="text-slate-300"> por pessoa</span>
                        </div>
                    )}
                </div>
              ) : (
                <div>
                  <label htmlFor="ccPerson" className="block text-sm font-medium text-slate-300 mb-1">Pessoa *</label>
                  <CustomSelect
                    id="ccPerson"
                    value={personId}
                    onChange={setPersonId}
                    placeholder="Selecione..."
                    options={people.map(p => ({ value: p.id, label: p.name }))}
                  />
              </div>
              )}
              
              <div>
                  <label htmlFor="ccInstallments" className="block text-sm font-medium text-slate-300 mb-1">Nº de Parcelas</label>
                  <input type="number" id="ccInstallments" value={installments} onChange={e => setInstallments(e.target.value)}
                      min="1" inputMode="numeric" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" disabled={isEditing && !!editingTransaction.installmentInfo}/>
              </div>
              
               {showInstallmentDetails && (
                    <div className="bg-slate-900/70 p-4 rounded-xl space-y-3">
                        <h4 className="text-md font-semibold text-white">Parcelamento</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ccInstallmentsNum" className="block text-sm font-medium text-slate-300 mb-1">Nº de Parcelas</label>
                                <input type="number" id="ccInstallmentsNum" value={installments} onChange={e => setInstallments(e.target.value)}
                                    min="1" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
                            </div>
                            <div>
                                <label htmlFor="ccInstallmentValue" className="block text-sm font-medium text-slate-300 mb-1">Valor da Parcela</label>
                                <input type="number" id="ccInstallmentValue" value={installmentValue} onChange={e => setInstallmentValue(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                                    step="0.01" inputMode="decimal" required />
                            </div>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300 pt-2">
                            <div className="flex justify-between"><span>Valor Original:</span> <span className="font-medium text-white">{formatCurrencyLocal(numAmount)}</span></div>
                            <div className="flex justify-between"><span>Valor com Juros:</span> <span className="font-medium text-white">{formatCurrencyLocal(totalWithInterest)}</span></div>
                            <div className="flex justify-between">
                                <span>Juros:</span> 
                                <span className="font-medium text-rose-400">
                                    {formatCurrencyLocal(interestAmount)} ({interestPercentage.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                                <span className="font-bold">{numInstallments}x de:</span> 
                                <span className="font-bold text-lg text-emerald-400">
                                    {formatCurrencyLocal(numInstallmentValue)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
              
              <div className="sm:col-span-2">
                  <label htmlFor="ccNotes" className="block text-sm font-medium text-slate-300 mb-1">Observações</label>
                  <textarea id="ccNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
              </div>
          </form>
        </div>

        <div className="p-8 pt-6 flex justify-end space-x-3 flex-shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">Cancelar</button>
          <button type="submit" form="card-tx-form" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              {isEditing ? 'Salvar' : 'Criar'}
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

export default AddCardTransactionModal;