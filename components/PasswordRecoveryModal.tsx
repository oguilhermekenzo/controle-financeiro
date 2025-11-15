import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Icon from './icons/Icon';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.href, // Or your dedicated password reset page
    });

    if (error) {
      setError('Ocorreu um erro. Verifique o email e tente novamente.');
    } else {
      setMessage(`Se uma conta com o email ${email} existir, um link de recuperação foi enviado.`);
      setIsSuccess(true);
    }
    setLoading(false);
  };
  
  const handleClose = () => {
    // Reset state on close
    setTimeout(() => {
        setEmail('');
        setMessage('');
        setError('');
        setIsSuccess(false);
        setLoading(false);
    }, 300);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-sm p-8 relative animate-fade-in-up">
        {isSuccess ? (
          <div className="text-center">
             <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/20 mb-4">
                <Icon name="paper-plane" className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifique seu Email</h2>
            <p className="text-slate-400 mb-6">{message}</p>
            <button onClick={handleClose} className="w-full px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
              Fechar
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Recuperar Senha</h2>
            <p className="text-slate-400 mb-6 text-center text-sm">Digite seu email para receber um link de redefinição de senha.</p>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="rec_email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="email" id="rec_email" value={email} onChange={e => setEmail(e.target.value)} required 
                       className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white" />
              </div>
              {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
              <div className="pt-2 flex flex-col gap-3">
                <button type="submit" disabled={loading} className="w-full px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400">
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </button>
                <button type="button" onClick={handleClose} className="w-full px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 font-semibold transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
