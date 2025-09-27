-- Initial schema migration for appointment management system

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service ON appointments(service_id);


-- Enable Row Level Security (RLS) for all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your auth requirements)
CREATE POLICY "Allow read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON services FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON appointments FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users (modify as needed)
CREATE POLICY "Allow insert for authenticated users" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated users" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated users" ON services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON services FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated users" ON services FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated users" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for authenticated users" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow delete for authenticated users" ON appointments FOR DELETE USING (true);