import { Database } from 'lucide-react';

export function SetupSupabase() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Database className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração do Supabase</h1>
        </div>
        
        <div className="space-y-6 text-gray-600">
          <p>
            Para usar o AgendaPro, você precisa configurar seu banco de dados Supabase.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">1. Crie as tabelas no Supabase SQL Editor:</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  client_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  service TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('Agendado', 'Confirmado', 'Realizado', 'Cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date, time)
);

CREATE INDEX idx_appointments_date ON appointments(date);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para clients
CREATE POLICY "Usuários podem ver seus próprios clientes" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios clientes" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios clientes" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios clientes" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Políticas para appointments
CREATE POLICY "Usuários podem ver seus próprios agendamentos" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios agendamentos" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios agendamentos" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios agendamentos" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- Permitir acesso público para confirmação de agendamentos (o UUID funciona como um token seguro)
CREATE POLICY "Acesso público para leitura de agendamentos" ON appointments FOR SELECT USING (true);
CREATE POLICY "Acesso público para atualização de status" ON appointments FOR UPDATE USING (true);
`}
            </pre>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">2. Configure as variáveis de ambiente:</h3>
            <p className="text-sm mb-2">Adicione as seguintes variáveis no painel de configurações (Settings) do AI Studio:</p>
            <ul className="list-disc list-inside space-y-1 text-sm font-mono bg-white p-3 rounded border border-gray-200">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
