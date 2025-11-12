
import React, { useState, useMemo } from 'react';
import Icon from './icons/Icon';

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selectedDate, onChange, onClose }) => {
  const [displayDate, setDisplayDate] = useState(selectedDate || new Date());

  const daysInMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [displayDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [displayDate]);

  const handlePrevMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    onChange(newDate);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-xs p-5 relative animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <Icon name="chevron-left" />
          </button>
          <span className="font-semibold text-white capitalize">
            {displayDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
            <Icon name="chevron-right" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-400 mb-2">
          {weekDays.map(day => <div key={day} className="font-medium">{day}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {leadingBlanks.map(blank => <div key={`blank-${blank}`}></div>)}
          {days.map(day => {
            const isSelected = selectedDate && 
                               selectedDate.getDate() === day &&
                               selectedDate.getMonth() === displayDate.getMonth() &&
                               selectedDate.getFullYear() === displayDate.getFullYear();
            
            const isToday = new Date().getDate() === day &&
                            new Date().getMonth() === displayDate.getMonth() &&
                            new Date().getFullYear() === displayDate.getFullYear();

            return (
              <button 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center font-semibold
                  ${isSelected ? 'bg-indigo-600 text-white' : 
                   isToday ? 'bg-slate-700 text-white' : 
                   'text-slate-200 hover:bg-slate-700'}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustomDatePicker;
