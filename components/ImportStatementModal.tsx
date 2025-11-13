import React, { useState } from 'react';
import { Account, ParsedTransaction, TransactionType } from '../types';
import { parseBankStatement } from '../services/geminiService';
import Icon from './icons/Icon';
import CustomSelect from './CustomSelect';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (transactions: ParsedTransaction[], accountName: string) => void;
  accounts: Account[];
}

type Step = 'paste' | 'review';

const ImportStatementModal: React.FC<ImportStatementModalProps> = ({ isOpen, onClose, onImport, accounts }) => {
  const [step, setStep] = useState<Step>('paste');
  const [statementText, setStatementText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.name || '');
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!statementText.trim() || !selectedAccount) {
      setError('Por favor, cole o extrato e selecione uma conta.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await parseBankStatement(statementText);
      setParsedTransactions(result);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    onImport(parsedTransactions, selectedAccount);
    handleClose();
  };
  
  const handleClose = () => {
    setStep('paste');
    setStatementText('');
    setParsedTransactions([]);
    setError('');
    setIsLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl w-full max-w-2xl p-8 relative animate-fade-in-up">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
          <Icon name="xmark" className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Importar Extrato Bancário</h2>
        
        {step === 'paste' && (
          <div className="space-y-4">
            <p className="text-slate-300">Cole o texto do seu extrato bancário (de um PDF, site, etc.) no campo abaixo. A IA irá analisar e extrair os lançamentos para você.</p>
            <div>
              <label htmlFor="importAccount" className="block text-sm font-medium text-slate-300 mb-1">
                Importar para a Conta
              </label>
              <CustomSelect
                  id="importAccount"
                  value={selectedAccount}
                  onChange={setSelectedAccount}
                  options={accounts.map(a => ({ value: a.name, label: a.name }))}
              />
            </div>
            <div>
              <label htmlFor="statementText" className="block text-sm font-medium text-slate-300 mb-1">
                Texto do Extrato
              </label>
              <textarea
                id="statementText"
                rows={10}
                value={statementText}
                onChange={e => setStatementText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                placeholder="Ex:&#10;01/07/2024 PIX RECEBIDO - NOME PESSOA - R$ 1.000,00&#10;02/07/2024 PAGAMENTO BOLETO SUPERMERCADO - R$ 150,50"
              />
            </div>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleParse} 
                disabled={isLoading}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Icon name="spinner" className="animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Icon name="wand-magic-sparkles" className="mr-2" />
                    Analisar e Revisar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <p className="text-slate-300">Revise os lançamentos encontrados. Se tudo estiver correto, clique em "Importar".</p>
            <div className="max-h-80 overflow-y-auto bg-slate-900/70 p-3 rounded-lg border border-slate-700">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                            <th className="py-2 px-3 font-medium">Data</th>
                            <th className="py-2 px-3 font-medium">Descrição</th>
                            <th className="py-2 px-3 font-medium text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parsedTransactions.map((t, index) => (
                            <tr key={index} className="border-b border-slate-800">
                                <td className="py-2.5 px-3">{new Date(t.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                <td className="py-2.5 px-3 text-slate-200">{t.description}</td>
                                <td className={`py-2.5 px-3 text-right font-semibold ${t.type === TransactionType.ENTRADA ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === TransactionType.ENTRADA ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="pt-4 flex justify-end space-x-3">
                <button onClick={() => setStep('paste')} className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors font-semibold">
                    Voltar
                </button>
                <button 
                    onClick={handleConfirmImport}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Icon name="check" className="mr-2"/>
                    Importar {parsedTransactions.length} Lançamentos
                </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportStatementModal;