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

-- Insert default services
INSERT INTO services (name, description, duration_minutes, price) VALUES
  ('Dry Cut', 'Basic haircut without wash', 30, 25.00),
  ('Cut & Wash', 'Haircut with shampoo and styling', 45, 35.00),
  ('Cut & Color', 'Haircut with full color treatment', 120, 85.00),
  ('Highlights', 'Partial highlights with cut', 90, 65.00),
  ('Blowout', 'Wash and professional styling', 30, 20.00),
  ('Deep Treatment', 'Conditioning treatment with styling', 60, 40.00)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO customers (name, email, phone) VALUES
  ('Sarah Johnson', 'sarah.j@email.com', '(555) 123-4567'),
  ('Mike Chen', 'mike.chen@email.com', '(555) 234-5678'),
  ('Emma Davis', 'emma.davis@email.com', '(555) 345-6789'),
  ('Alex Rodriguez', 'alex.r@email.com', '(555) 456-7890'),
  ('Lisa Thompson', 'lisa.t@email.com', '(555) 567-8901')
ON CONFLICT DO NOTHING;
