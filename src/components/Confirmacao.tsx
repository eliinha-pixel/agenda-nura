import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Confirmacao() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [actionMessage, setActionMessage] = useState('');

  const appointmentId = window.location.pathname.split('/').pop();

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    } else {
      setError('Link inválido.');
      setLoading(false);
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (error) throw error;
      setAppointment(data);
    } catch (err: any) {
      setError('Agendamento não encontrado ou link expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status: 'Confirmado' | 'Cancelado') => {
    setLoading(true);
    setActionStatus('idle');
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointment(prev => prev ? { ...prev, status } : null);
      setActionStatus('success');
      setActionMessage(status === 'Confirmado' ? 'Agendamento confirmado com sucesso!' : 'Agendamento cancelado com sucesso.');
    } catch (err: any) {
      setActionStatus('error');
      setActionMessage('Ocorreu um erro ao atualizar o agendamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !appointment) {
    return (
      <div className="min-h-screen bg-brand-tertiary/30 flex items-center justify-center p-4">
        <div className="text-slate-500">Carregando informações...</div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-brand-tertiary/30 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ops!</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const dateObj = parseISO(appointment.date);
  const formattedDate = format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const isPending = appointment.status === 'Agendado';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a2e] via-[#4c1d95] to-[#7c3aed] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blur circles */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[120px]"></div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-md w-full relative z-10 transition-all duration-500 animate-in fade-in zoom-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#0a0a2e] via-[#4c1d95] to-[#7c3aed] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-200">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Confirmação de Agendamento</h1>
          <p className="text-slate-500 mt-2 font-medium">Olá, {appointment.client_name}!</p>
        </div>

        <div className="bg-violet-50/50 rounded-3xl p-6 mb-8 space-y-4 border border-violet-100">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-violet-100">
              <User className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Serviço</p>
              <p className="text-slate-900 font-bold">{appointment.service}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-violet-100">
              <Calendar className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data</p>
              <p className="text-slate-900 font-bold">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-white flex items-center justify-center shadow-sm flex-shrink-0 border border-violet-100">
              <Clock className="w-4 h-4 text-brand-primary" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Horário</p>
              <p className="text-slate-900 font-bold">{appointment.time.substring(0, 5)}</p>
            </div>
          </div>
        </div>

        {actionStatus === 'success' || !isPending ? (
          <div className={`p-5 rounded-3xl flex items-center space-x-4 ${appointment.status === 'Confirmado' ? 'bg-green-50 text-green-800 border border-green-100' : appointment.status === 'Cancelado' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-violet-50 text-violet-800 border border-violet-100'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${appointment.status === 'Confirmado' ? 'bg-green-100' : appointment.status === 'Cancelado' ? 'bg-red-100' : 'bg-violet-100'}`}>
              {appointment.status === 'Confirmado' ? <CheckCircle className="w-6 h-6 text-green-600" /> : appointment.status === 'Cancelado' ? <XCircle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-brand-primary" />}
            </div>
            <div className="font-bold text-sm">
              {appointment.status === 'Confirmado' ? 'Agendamento Confirmado!' : appointment.status === 'Cancelado' ? 'Agendamento Cancelado.' : 'Agendamento Realizado.'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => handleAction('Confirmado')}
              disabled={loading}
              className="w-full bg-[#1a1a1a] hover:bg-black text-white font-bold py-4 px-4 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer transform active:scale-[0.98]"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Confirmar Agendamento</span>
            </button>
            <button
              onClick={() => handleAction('Cancelado')}
              disabled={loading}
              className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-4 px-4 rounded-2xl border border-red-100 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer transform active:scale-[0.98]"
            >
              <XCircle className="w-5 h-5" />
              <span>Cancelar Agendamento</span>
            </button>
          </div>
        )}

        {actionStatus === 'error' && (
          <p className="text-red-500 text-sm text-center mt-4">{actionMessage}</p>
        )}
      </div>
    </div>
  );
}
