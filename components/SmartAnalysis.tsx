import React, { useState, useCallback } from 'react';
import { Transaction, CreditCardTransaction } from '../types';
import { getFinancialAnalysis } from '../services/geminiService';
import Icon from './icons/Icon';
import ReactMarkdown from 'react-markdown';

interface SmartAnalysisProps {
  transactions: Transaction[];
  creditCardTransactions: CreditCardTransaction[];
}

const examplePrompts = [
    "Onde gastei mais dinheiro este mês, somando contas e cartões?",
    "Compare meus gastos com alimentação e transporte.",
    "Qual foi meu dia mais caro?",
    "Resuma minhas receitas do último trimestre.",
];

const SmartAnalysis: React.FC<SmartAnalysisProps> = ({ transactions, creditCardTransactions }) => {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = useCallback(async (currentPrompt: string) => {
    if (!currentPrompt.trim()) {
      setError('Por favor, digite uma pergunta para análise.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysis('');
    try {
      const result = await getFinancialAnalysis(transactions, creditCardTransactions, currentPrompt);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [transactions, creditCardTransactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalyze(prompt);
  };
    
  const handleExampleClick = (example: string) => {
    setPrompt(example);
    handleAnalyze(example);
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 p-6 sm:p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
        <Icon name="wand-magic-sparkles" className="mr-3 text-indigo-400" />
        Análise Inteligente (com Gemini)
      </h2>
      <p className="text-slate-400 mb-6">Faça uma pergunta em linguagem natural sobre suas finanças e receba insights instantâneos.</p>
      
      <div className="mb-6">
          <p className="text-sm text-slate-300 mb-2">Experimente:</p>
          <div className="flex flex-wrap gap-2">
              {examplePrompts.map(p => (
                  <button key={p} onClick={() => handleExampleClick(p)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs px-3 py-1.5 rounded-full transition-colors">
                      {p}
                  </button>
              ))}
          </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Qual categoria teve mais gastos no último mês?"
          className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed flex items-center justify-center">
          {isLoading ? (
            <>
              <Icon name="spinner" className="animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Icon name="paper-plane" className="mr-2" />
              Perguntar
            </>
          )}
        </button>
      </form>

      {error && <p className="text-rose-400 mt-4">{error}</p>}
      
      {analysis && (
        <div className="mt-8 p-5 bg-slate-900/50 rounded-xl border border-slate-700">
           <ReactMarkdown className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-ul:text-slate-300 prose-li:marker:text-indigo-400">
            {analysis}
           </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default SmartAnalysis;