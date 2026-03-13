-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  service TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('Agendado', 'Realizado', 'Cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(date, time)
);

-- Create an index for faster date queries
CREATE INDEX idx_appointments_date ON appointments(date);
