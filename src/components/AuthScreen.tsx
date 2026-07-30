import React, { useState } from 'react';
import { User } from '../types/nursing';
import { Lock, ShieldCheck, Stethoscope, FileText, Eye, EyeOff } from 'lucide-react';
import { getDDMMFromBirthDate } from '../data/mockUsers';
import { TermsModal } from './TermsModal';

interface AuthScreenProps {
  users: User[];
  onLogin: (user: User) => void;
  onAddUser: (user: Omit<User, 'id'>) => void;
}

const DEFAULT_ADMIN_USER: User = {
  id: 'u-admin',
  name: 'Administrador do Sistema',
  role: 'Admin',
  coren: 'COREN-ADMIN',
  birthDate: '1980-01-01',
  username: 'admin',
  pin: '0000'
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ users, onLogin }) => {
  const [loginInput, setLoginInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!acceptedTerms) {
      setErrorMsg('Você precisa aceitar os Termos e Condições de Uso para acessar o sistema.');
      return;
    }

    const trimmedLogin = loginInput.trim();
    if (!trimmedLogin) {
      setErrorMsg('Informe o seu login (DDMM ou admin).');
      return;
    }

    // Direct match for admin username or admin PIN
    if (trimmedLogin.toLowerCase() === 'admin' || trimmedLogin === '0101') {
      const adminUser =
        users.find((u) => u.username?.toLowerCase() === 'admin' || u.role === 'Admin') ||
        DEFAULT_ADMIN_USER;

      const validPin = adminUser.pin || '0000';
      if (pinInput === validPin) {
        onLogin(adminUser);
        return;
      } else {
        setErrorMsg('Senha do Administrador incorreta (PIN padrão: 0000).');
        return;
      }
    }

    // Match by username or DDMM birthdate calculation
    const user = users.find(
      (u) =>
        u.username?.toLowerCase() === trimmedLogin.toLowerCase() ||
        getDDMMFromBirthDate(u.birthDate) === trimmedLogin
    );

    if (!user) {
      setErrorMsg('Profissional não encontrado. Contate o Administrador para cadastrar seu login.');
      return;
    }

    const validUserPin = user.pin || getDDMMFromBirthDate(user.birthDate);
    if (validUserPin && pinInput !== validUserPin) {
      setErrorMsg('Senha incorreta. A senha inicial é o seu PIN de 4 dígitos (DDMM).');
      return;
    }

    onLogin(user);
  };

  const fillAdminCredentials = () => {
    setLoginInput('admin');
    setPinInput(''); // Limpo por segurança: o usuário digita a senha 0000
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Top Logo Badge */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 mx-auto rounded-full border-[2.5px] border-[#0a3962] bg-white flex items-center justify-center shadow-sm relative group">
            <Stethoscope className="w-10 h-10 text-emerald-700 transform stroke-[1.75]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-extrabold text-[#0d2b45] tracking-tight">
              Relatório de Enfermagem
            </h1>
            <p className="text-xs font-serif text-slate-500 italic font-medium">
              Registro Digital para Plantões no HMMV
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl p-7 shadow-lg border border-slate-100 space-y-5">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl font-medium animate-fadeIn">
              <span className="font-bold">Aviso:</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                LOGIN (DIA+MÊS DO SEU ANIVERSÁRIO)
              </label>
              <input
                type="text"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="DDMM"
                className="w-full bg-slate-50/80 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#003865] focus:border-transparent font-mono tracking-wide transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                SENHA (PIN DE 4 DÍGITOS)
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-50/80 border border-slate-300 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-[#003865] focus:border-transparent font-mono tracking-widest transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors"
                  title={showPin ? 'Ocultar Senha' : 'Visualizar Senha'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#003865] focus:ring-[#003865] cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-serif font-medium group-hover:text-slate-800 transition-colors">
                  Lembrar-me neste dispositivo
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer group select-none pt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-[#003865] focus:ring-[#003865] cursor-pointer"
                  required
                />
                <span className="text-xs text-slate-700 font-serif font-semibold group-hover:text-slate-900 transition-colors">
                  Li e aceito os{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowTermsModal(true);
                    }}
                    className="text-[#003865] font-bold underline hover:text-[#002244]"
                  >
                    Termos e Condições de Uso
                  </button>
                  <span className="text-rose-600 ml-0.5">*</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#003865] hover:bg-[#00284d] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 tracking-wide uppercase mt-2"
            >
              <Lock className="w-4 h-4 text-sky-200" />
              <span>Entrar</span>
            </button>
          </form>
        </div>

        {/* Admin Login Link & Terms */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#003865] hover:text-[#002244] hover:underline transition-colors py-1 px-3 rounded-lg hover:bg-slate-200/50"
            >
              <ShieldCheck className="w-4 h-4 text-[#003865]" />
              <span>Acesso Administrativo</span>
            </button>

            <span className="text-slate-300">•</span>

            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline transition-colors py-1 px-3 rounded-lg hover:bg-slate-200/50"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600" />
              <span>Termos de Uso</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-serif leading-relaxed px-4">
            Para cadastro de novos profissionais ou suporte, contate a coordenação ou o administrador do sistema (Senha inicial do Admin: 0000).
          </p>
        </div>
      </div>

      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
    </div>
  );
};

