import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Icon from './icons/Icon';
import PasswordRecoveryModal from './PasswordRecoveryModal';

interface AuthProps {
    // onLogin prop is no longer needed as App.tsx will listen to auth changes
}

const Auth: React.FC<AuthProps> = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecoveryModalOpen, setRecoveryModalOpen] = useState(false);

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isLoginView) {
            // Login Logic
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError('Email ou senha inválidos.');
            }
            // On success, onAuthStateChange in App.tsx will handle the redirect.
        } else {
            // Registration Logic
            if (!name.trim()) {
                 setError('Por favor, insira seu nome.');
                 setLoading(false);
                 return;
            }
            if (!validateEmail(email)) {
                setError('Por favor, insira um email válido.');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                setLoading(false);
                return;
            }
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setLoading(false);
                return;
            }
            
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    },
                },
            });

            if (error) {
                setError(error.message);
            }
            // On success, onAuthStateChange will handle login.
            // Supabase may require email confirmation depending on your project settings.
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center mb-8">
                    <Icon name="piggy-bank" className="text-5xl text-indigo-400 mr-4" />
                    <h1 className="text-3xl font-bold text-white">Meu Financeiro</h1>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
                    <div className="flex mb-6 rounded-lg bg-slate-900 p-1">
                        <button onClick={() => setIsLoginView(true)} className={`w-1/2 py-2.5 rounded-md transition-all duration-300 text-sm font-semibold ${isLoginView ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
                            Entrar
                        </button>
                        <button onClick={() => setIsLoginView(false)} className={`w-1/2 py-2.5 rounded-md transition-all duration-300 text-sm font-semibold ${!isLoginView ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}>
                            Registrar
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLoginView ? 'Acesse sua conta' : 'Crie uma nova conta'}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoginView && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Nome</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required 
                                       className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required 
                                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">Senha</label>
                                {isLoginView && <button type="button" onClick={() => setRecoveryModalOpen(true)} className="text-xs text-indigo-400 hover:underline">Esqueceu a senha?</button>}
                            </div>
                            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required 
                                   className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        {!isLoginView && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirmar Senha</label>
                                <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required 
                                       className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        )}
                        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}
                        <div className="pt-2">
                             <button type="submit" disabled={loading} className="w-full px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400">
                                {loading ? 'Carregando...' : (isLoginView ? 'Entrar' : 'Criar Conta')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <PasswordRecoveryModal 
                isOpen={isRecoveryModalOpen} 
                onClose={() => setRecoveryModalOpen(false)} 
            />
        </div>
    );
};

export default Auth;