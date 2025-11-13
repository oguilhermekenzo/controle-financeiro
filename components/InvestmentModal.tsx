import React, { useState, useEffect } from 'react';
import { Investment, InvestmentType } from '../types';
import Icon from './icons/Icon';
import CustomDatePicker from './CustomDatePicker';
import CustomSelect from './CustomSelect';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInvestment: (investment: Omit<Investment, 'id'>) => void;
  onEditInvestment: (investment: Investment) => void;
  editingInvestment: Investment | null;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onAddInvestment, onEditInvestment, editingInvestment }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>(InvestmentType.ACOES);
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  const isEditing = !!editingInvestment;

  useEffect(() => {
    if (isOpen) {
      if (isEditing) {
        setName(editingInvestment.name);
        setType(editingInvestment.type);
        setQuantity(String(editingInvestment.quantity));
        setUnitPrice(String(editingInvestment.unitPrice));
        setCurrentValue(String(editingInvestment.currentValue));
        setAcquisitionDate(editingInvestment.acquisitionDate);
      } else {
        setName('');
        setType(InvestmentType.ACOES);
        setQuantity('');
        setUnitPrice('');
        setCurrentValue('');
        setAcquisitionDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [editingInvestment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !unitPrice || !currentValue || !acquisitionDate) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const investmentData = {
      name,
      type,
      quantity: parseFloat(quantity),
      unitPrice: parseFloat(unitPrice),
      currentValue: parseFloat(currentValue),
      acquisitionDate,
    };

    if (isEditing) {
      onEditInvestment({ ...investmentData, id: editingInvestment.id });
    } else {
      onAddInvestment(investmentData);
    }

    onClose();
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Editar Investimento' : 'Novo Investimento'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
                <label htmlFor="inv_name" className="block text-sm font-medium text-slate-300 mb-1">Nome do Ativo</label>
                <input type="text" id="inv_name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" placeholder="Ex: ITSA4, Tesouro Selic" required />
            </div>
            <div className="sm:col-span-2">
                <label htmlFor="inv_type" className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
                <CustomSelect
                  id="inv_type"
                  value={type}
                  onChange={(val) => setType(val as InvestmentType)}
                  options={Object.values(InvestmentType).map(t => ({ value: t, label: t }))}
                />
            </div>
             <div>
                <label htmlFor="inv_quantity" className="block text-sm font-medium text-slate-300 mb-1">Quantidade</label>
                <input type="number" id="inv_quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="any" inputMode="decimal" required />
            </div>
            <div>
                <label htmlFor="inv_unit_price" className="block text-sm font-medium text-slate-300 mb-1">Preço Unit. (Compra)</label>
                <input type="number" id="inv_unit_price" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="0.01" inputMode="decimal" required />
            </div>
            <div>
                <label htmlFor="inv_current_value" className="block text-sm font-medium text-slate-300 mb-1">Valor Atual Total</label>
                <input type="number" id="inv_current_value" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" step="0.01" inputMode="decimal" required />
            </div>
            <div>
                <label htmlFor="inv_date" className="block text-sm font-medium text-slate-300 mb-1">Data da Compra</label>
                 <button type="button" onClick={() => setDatePickerOpen(true)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center"
                >
                  <span>{new Date(acquisitionDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <Icon name="calendar-days" />
                </button>
            </div>
          </div>
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">{isEditing ? 'Salvar' : 'Adicionar'}</button>
          </div>
        </form>
      </div>
    </div>
     {isDatePickerOpen && (
        <CustomDatePicker
          selectedDate={new Date(acquisitionDate + 'T12:00:00')}
          onChange={newDate => {
            setAcquisitionDate(newDate.toISOString().split('T')[0]);
            setDatePickerOpen(false);
          }}
          onClose={() => setDatePickerOpen(false)}
        />
    )}
    </>
  );
};

export default InvestmentModal;