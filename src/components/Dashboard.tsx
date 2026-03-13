import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment, Client } from '../types';
import { format, addDays, startOfWeek, endOfWeek, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, X, Check, Plus, Clock, User, Info, Trash2, Share2 } from 'lucide-react';

export function Dashboard({ searchTerm = '' }: { searchTerm?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'hoje' | 'amanha' | 'semana' | 'mes'>('hoje');
  const [userName, setUserName] = useState('Admin');
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0]);
      }
    };
    getUser();
  }, []);
  const [formData, setFormData] = useState({
    client_name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    service: '',
    notes: '',
    status: 'Agendado'
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, [filter]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date();
      let startDate = format(today, 'yyyy-MM-dd');
      let endDate = format(today, 'yyyy-MM-dd');

      if (filter === 'amanha') {
        const tomorrow = addDays(today, 1);
        startDate = format(tomorrow, 'yyyy-MM-dd');
        endDate = format(tomorrow, 'yyyy-MM-dd');
      } else if (filter === 'semana') {
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      } else if (filter === 'mes') {
        startDate = format(startOfMonth(today), 'yyyy-MM-dd');
        endDate = format(endOfMonth(today), 'yyyy-MM-dd');
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDeleteConfirmId(null);
      fetchAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Erro ao excluir agendamento. Verifique se você tem permissão.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (app: Appointment) => {
    setEditingId(app.id);
    setFormData({
      client_name: app.client_name,
      date: app.date,
      time: app.time.substring(0, 5),
      service: app.service,
      notes: app.notes || '',
      status: app.status
    });
    document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      client_name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      service: '',
      notes: '',
      status: 'Agendado'
    });
    setFormError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('date', formData.date)
        .eq('time', formData.time + ':00')
        .neq('status', 'Cancelado');

      if (conflicts && conflicts.length > 0) {
        const isSameAppointment = editingId && conflicts.some(c => c.id === editingId);
        if (!isSameAppointment) {
          throw new Error('Já existe um agendamento para este horário.');
        }
      }

      if (editingId) {
        const { error: updateError } = await supabase
          .from('appointments')
          .update({
            client_name: formData.client_name,
            date: formData.date,
            time: formData.time,
            service: formData.service,
            notes: formData.notes,
            status: formData.status
          })
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('appointments')
          .insert([{
            client_name: formData.client_name,
            date: formData.date,
            time: formData.time,
            service: formData.service,
            notes: formData.notes,
            status: formData.status
          }]);

        if (insertError) throw insertError;
      }

      resetForm();
      fetchAppointments();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar agendamento.');
    } finally {
      setFormLoading(false);
    }
  };

  const getFilterText = () => {
    if (filter === 'hoje') return 'para hoje';
    if (filter === 'amanha') return 'para amanhã';
    if (filter === 'semana') return 'para esta semana';
    return 'para este mês';
  };

  const activeCount = appointments.filter(a => a.status !== 'Cancelado').length;

  const handleShare = (app: Appointment) => {
    const dateObj = parseISO(app.date);
    const formattedDate = format(dateObj, "dd/MM/yyyy");
    const time = app.time.substring(0, 5);
    const url = `${window.location.origin}/confirmar/${app.id}`;
    
    const text = `Olá ${app.client_name}! Seu agendamento para *${app.service}* está marcado para o dia *${formattedDate}* às *${time}*.\n\nPor favor, confirme ou cancele seu horário acessando o link abaixo:\n${url}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const renderAppointmentCard = (app: Appointment) => {
    const dateObj = parseISO(app.date);
    const month = format(dateObj, 'MMM', { locale: ptBR }).toUpperCase();
    const day = format(dateObj, 'dd');
    const isRealizado = app.status === 'Realizado';
    const isCancelado = app.status === 'Cancelado';
    const isInactive = isRealizado || isCancelado;

    return (
      <div key={app.id} className={`bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 shadow-sm transition-all hover:shadow-md gap-4 ${isInactive ? 'opacity-60' : ''}`}>
        <div className="flex items-center space-x-5">
          <div className={`rounded-xl p-3 flex flex-col items-center justify-center min-w-[4.5rem] h-[4.5rem] ${isInactive ? 'bg-slate-100' : 'bg-brand-primary shadow-sm shadow-violet-100'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isInactive ? 'text-slate-400' : 'text-white/80'}`}>{month}</span>
            <span className={`text-2xl font-black leading-none mt-0.5 ${isInactive ? 'text-slate-500' : 'text-white'}`}>{day}</span>
          </div>
          
          <div>
            <div className="flex items-center space-x-3">
              <h3 className={`font-bold text-lg ${isInactive ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                {app.service}
              </h3>
              {app.status === 'Confirmado' && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md">
                  Confirmado
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-slate-500 text-sm mt-1.5">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4" />
                <span>{app.time.substring(0, 5)}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <User className="w-4 h-4" />
                <span>{app.client_name}</span>
              </div>
            </div>
            {app.notes && (
              <div className="mt-2 text-xs text-slate-400 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 max-w-sm">
                "{app.notes}"
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {!isInactive ? (
            <>
              <button onClick={() => handleShare(app)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer" title="Compartilhar no WhatsApp">
                <Share2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleEdit(app)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-brand-tertiary hover:text-slate-800 transition-colors cursor-pointer" title="Editar">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleStatusChange(app.id, 'Cancelado')} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer" title="Cancelar">
                <X className="w-5 h-5" />
              </button>
              <button onClick={() => handleStatusChange(app.id, 'Realizado')} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-colors cursor-pointer" title="Concluir">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setDeleteConfirmId(app.id)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wide ${isRealizado ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {app.status.toUpperCase()}
              </span>
              <button onClick={() => setDeleteConfirmId(app.id)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer ml-2" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    if (loading) {
      return <div className="text-center py-8 text-slate-500">Carregando...</div>;
    }

    const filteredAppointments = appointments.filter(app => 
      app.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredAppointments.length === 0) {
      return <div className="text-center py-8 text-slate-500">Nenhum agendamento encontrado.</div>;
    }

    if (filter === 'semana' || filter === 'mes') {
      const grouped = filteredAppointments.reduce((acc, app) => {
        if (!acc[app.date]) acc[app.date] = [];
        acc[app.date].push(app);
        return acc;
      }, {} as Record<string, Appointment[]>);

      return (Object.entries(grouped) as [string, Appointment[]][]).map(([dateStr, apps]) => {
        const dateObj = parseISO(dateStr);
        const dayOfWeek = format(dateObj, 'EEEE', { locale: ptBR });
        const formattedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

        return (
          <div key={dateStr} className="mb-8 last:mb-0">
            <h3 className="text-sm font-bold text-slate-700 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>{formattedDay}</span>
              <span className="text-slate-400 font-medium">{format(dateObj, 'dd/MM')}</span>
            </h3>
            <div className="space-y-4">
              {apps.map(app => renderAppointmentCard(app))}
            </div>
          </div>
        );
      });
    }

    return (
      <div className="space-y-4">
        {filteredAppointments.map(app => renderAppointmentCard(app))}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 sm:mb-10 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-slate-800">{getGreeting()}, <span className="text-brand-primary font-bold">{userName}</span></h1>
          <p className="text-slate-500 mt-2">Você tem {activeCount} agendamentos marcados {getFilterText()}.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column - List */}
        <div className="xl:col-span-2 space-y-8">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setFilter('hoje')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all cursor-pointer ${filter === 'hoje' ? 'bg-brand-primary text-white shadow-md shadow-violet-100' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'}`}
            >
              Hoje
            </button>
            <button 
              onClick={() => setFilter('amanha')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all cursor-pointer ${filter === 'amanha' ? 'bg-brand-primary text-white shadow-md shadow-violet-100' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'}`}
            >
              Amanhã
            </button>
            <button 
              onClick={() => setFilter('semana')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all cursor-pointer ${filter === 'semana' ? 'bg-brand-primary text-white shadow-md shadow-violet-100' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'}`}
            >
              Esta semana
            </button>
            <button 
              onClick={() => setFilter('mes')}
              className={`px-5 py-2 text-sm font-bold rounded-full transition-all cursor-pointer ${filter === 'mes' ? 'bg-brand-primary text-white shadow-md shadow-violet-100' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'}`}
            >
              Este mês
            </button>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Próximos Agendamentos</h2>
            
            <div className="space-y-4">
              {renderAppointments()}
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="xl:col-span-1" id="form-section">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 xl:sticky xl:top-8 xl:-mt-24">
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              {editingId ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome do Cliente</label>
                <input
                  required
                  type="text"
                  value={formData.client_name}
                  onChange={e => {
                    setFormData({...formData, client_name: e.target.value});
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm text-slate-800"
                  placeholder="Ex: João Silva"
                />
                
                {/* Custom Client Autocomplete Dropdown */}
                {showClientDropdown && clients.filter(c => c.name.toLowerCase().includes(formData.client_name.toLowerCase())).length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {clients.filter(c => c.name.toLowerCase().includes(formData.client_name.toLowerCase())).map(c => (
                      <div
                        key={c.id}
                        className="px-4 py-3 hover:bg-brand-tertiary/50 cursor-pointer text-sm text-slate-700 border-b border-slate-50 last:border-0"
                        onClick={() => {
                          setFormData({...formData, client_name: c.name});
                          setShowClientDropdown(false);
                        }}
                      >
                        <div className="font-medium">{c.name}</div>
                        {c.phone && <div className="text-xs text-slate-400 mt-0.5">{c.phone}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora</label>
                  <input
                    required
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Serviço</label>
                <input
                  required
                  type="text"
                  value={formData.service}
                  onChange={e => setFormData({...formData, service: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all text-sm text-slate-800"
                  placeholder="Ex: Consulta Geral"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observação (Opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all resize-none h-24 text-sm text-slate-800"
                  placeholder="Breve descrição..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-4 rounded-xl bg-brand-primary text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>{formLoading ? 'Aguarde...' : 'Agendar Horário'}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 bg-violet-50 rounded-xl p-4 flex items-start space-x-3 border border-violet-100">
              <Info className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-600 leading-relaxed">
                <strong className="text-violet-700">Dica:</strong> Você pode selecionar clientes já cadastrados digitando o nome no campo acima.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Agendamento?</h3>
            <p className="text-slate-500 mb-8">Esta ação não pode ser desfeita. Tem certeza que deseja remover este agendamento?</p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
