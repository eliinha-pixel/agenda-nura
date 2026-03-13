export interface Appointment {
  id: string;
  client_name: string;
  date: string;
  time: string;
  service: string;
  notes: string | null;
  status: 'Agendado' | 'Confirmado' | 'Realizado' | 'Cancelado';
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  cpf: string | null;
  created_at: string;
}
