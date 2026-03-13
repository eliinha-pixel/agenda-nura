import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Phone, Loader2, Calendar, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            }
          }
        });
        if (error) throw error;
        
        if (data.user && !data.session) {
          setSuccess('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar o cadastro.');
          setFormData({ fullName: '', email: '', password: '' });
          setIsLogin(true);
        } else if (data.session) {
          // Logged in automatically
        } else {
          setSuccess('Conta criada com sucesso! Você já pode fazer login.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      if (err.message === 'Invalid login credentials') {
        setError('E-mail ou senha incorretos.');
      } else if (err.message === 'User already registered') {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(err.message || 'Ocorreu um erro durante a autenticação.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4 md:p-8 font-sans">
      <div className="bg-white rounded-none sm:rounded-[40px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative">
        
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative z-10">
          <div className="max-w-sm w-full mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
                {isLogin ? 'Olá!' : 'Criar conta'}
              </h1>
              <p className="text-slate-500 text-base font-medium">
                {isLogin 
                  ? 'Bem-vindo ao Agenda Nura.' 
                  : 'Gerencie seus atendimentos, clientes e horários em um único lugar.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-2xl text-sm mb-5 border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-2xl text-sm mb-5 border border-green-100 animate-in fade-in slide-in-from-top-2 duration-300">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="block w-full px-4 py-3 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-slate-50/50 transition-all placeholder-slate-400 text-slate-700 text-sm"
                        placeholder="Nome completo"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-slate-50/50 transition-all placeholder-slate-400 text-slate-700 text-sm"
                    placeholder="Seu e-mail"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full px-4 py-3 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-transparent bg-slate-50/50 transition-all placeholder-slate-400 text-slate-700 pr-12 text-sm"
                    placeholder="Senha"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {isLogin && (
                  <div className="flex justify-end pt-1">
                    <a href="#" className="text-xs text-[#4c1d95] font-bold hover:underline transition-all">
                      Esqueceu a senha?
                    </a>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-[#1a1a1a] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 transform active:scale-[0.98]"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>{isLogin ? 'Entrar' : 'Criar Conta'}</span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'} {' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-[#4c1d95] font-bold hover:underline transition-all"
                >
                  {isLogin ? 'Criar conta' : 'Entrar'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Gradient & Info */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#0a0a2e] via-[#4c1d95] to-[#7c3aed] p-10 md:p-12 flex-col relative overflow-hidden">
          {/* Decorative blur circles */}
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px]"></div>
          
          <div className="absolute top-10 right-10 flex items-center gap-5 z-20">
            <button 
              onClick={() => setIsLogin(true)}
              className={`text-xs font-bold transition-all ${isLogin ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className="px-5 py-2 rounded-xl border border-white/30 text-white text-xs font-bold hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Cadastrar
            </button>
          </div>

          <div className="mt-auto relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md border border-white/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">Agenda Nura</span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-[1.1] mb-4 tracking-tight">
              Organize sua agenda com simplicidade.
            </h2>
            <p className="text-white/70 text-base leading-relaxed max-w-sm">
              Gerencie seus atendimentos, acompanhe seus clientes e mantenha sua rotina organizada com o Nura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
