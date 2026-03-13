import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, X, Save, Edit2, Trash2 } from 'lucide-react';
import { Client } from '../types';

interface ClientWithCount extends Client {
  appointments_count?: number;
}

export function Clientes() {
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (clientsError) throw clientsError;

      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('client_name');

      if (apptError) throw apptError;

      const apptCounts = apptData?.reduce((acc, curr) => {
        acc[curr.client_name] = (acc[curr.client_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const clientsWithCounts = clientsData?.map(c => ({
        ...c,
        appointments_count: apptCounts?.[c.name] || 0
      }));

      setClients(clientsWithCounts || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (editingClient) {
        // If name changed, update appointments too
        if (formData.name !== editingClient.name) {
          await supabase
            .from('appointments')
            .update({ client_name: formData.name })
            .eq('client_name', editingClient.name);
        }

        const { error } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            cpf: formData.cpf || null
          })
          .eq('id', editingClient.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{
            name: formData.name,
            phone: formData.phone || null,
            cpf: formData.cpf || null
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({ name: '', phone: '', cpf: '' });
      fetchClients();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      cpf: client.cpf || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete);

      if (error) throw error;
      setClientToDelete(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setFormError('Erro ao excluir cliente.');
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Clientes</h1>
        <p className="text-slate-500 mt-1">Gerencie sua base de clientes</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: '', phone: '', cpf: '' });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-brand-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-lg shadow-violet-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Nome do Cliente</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Agendamentos</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Celular / WhatsApp</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">CPF</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Carregando clientes...</td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-xs">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{client.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      <span className="bg-slate-100 text-slate-600 py-1 px-3 rounded-full text-xs">
                        {client.appointments_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{client.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{client.cpf || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(client)}
                        className="p-2 text-slate-400 hover:text-brand-primary transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Celular / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  placeholder="Ex: (11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CPF (Opcional)</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={e => setFormData({...formData, cpf: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  placeholder="Ex: 000.000.000-00"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-primary text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{formLoading ? 'Salvando...' : 'Salvar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Excluir Cliente</h3>
            <p className="text-slate-500 mb-6">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setClientToDelete(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
