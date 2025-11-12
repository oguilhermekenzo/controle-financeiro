import React from 'react';
import Icon from './icons/Icon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Sim, Excluir",
  confirmButtonClass = ''
}) => {
  if (!isOpen) return null;

  const finalConfirmButtonClass = confirmButtonClass || 'bg-rose-600 hover:bg-rose-700';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-8 relative animate-fade-in-up text-center">
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${finalConfirmButtonClass.includes('rose') ? 'bg-rose-500/20' : 'bg-emerald-500/20'} mb-4`}>
            <Icon name="triangle-exclamation" className={`h-6 w-6 ${finalConfirmButtonClass.includes('rose') ? 'text-rose-400' : 'text-emerald-400'}`} />
        </div>
        <h3 className="text-lg font-medium leading-6 text-white" id="modal-title">
          {title}
        </h3>
        <div className="mt-2">
          <p className="text-sm text-slate-400">
            {message}
          </p>
        </div>
        <div className="mt-8 flex justify-center space-x-4">
          <button
            type="button"
            className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`px-5 py-2.5 text-white font-semibold rounded-lg transition-colors ${finalConfirmButtonClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;