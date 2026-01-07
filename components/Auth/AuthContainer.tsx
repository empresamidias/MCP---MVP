
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { AuthView } from '../../types';

const AuthContainer: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 transform rotate-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            N8N-Gemini Bridge
          </h1>
          <p className="text-slate-400 text-center text-sm px-4">
            A ponte inteligente entre sua automação n8n e a inteligência do Google Gemini.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
          <div className="flex p-1 bg-slate-950 rounded-xl mb-8">
            <button
              onClick={() => setView('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                view === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setView('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                view === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {view === 'login' ? (
            <LoginForm />
          ) : (
            <RegisterForm onSwitchToLogin={() => setView('login')} />
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-slate-300">Termos de Serviço</a> e <a href="#" className="underline hover:text-slate-300">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
};

export default AuthContainer;
