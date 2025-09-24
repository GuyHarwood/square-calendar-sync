-- Insert sample appointments for the next few days
INSERT INTO appointments (customer_id, service_id, appointment_date, appointment_time, status, notes) 
SELECT 
  c.id,
  s.id,
  appointment_date,
  appointment_time,
  'scheduled',
  notes
FROM (
  SELECT 
    (SELECT id FROM customers WHERE name = 'Sarah Johnson') as customer_id,
    (SELECT id FROM services WHERE name = 'Cut & Color') as service_id,
    CURRENT_DATE + INTERVAL '1 day' as appointment_date,
    '10:00'::time as appointment_time,
    'First time client, wants subtle highlights' as notes
  UNION ALL
  SELECT 
    (SELECT id FROM customers WHERE name = 'Mike Chen') as customer_id,
    (SELECT id FROM services WHERE name = 'Dry Cut') as service_id,
    CURRENT_DATE + INTERVAL '1 day' as appointment_date,
    '14:30'::time as appointment_time,
    'Regular client, usual trim' as notes
  UNION ALL
  SELECT 
    (SELECT id FROM customers WHERE name = 'Emma Davis') as customer_id,
    (SELECT id FROM services WHERE name = 'Blowout') as service_id,
    CURRENT_DATE + INTERVAL '2 days' as appointment_date,
    '09:00'::time as appointment_time,
    'Special event styling' as notes
  UNION ALL
  SELECT 
    (SELECT id FROM customers WHERE name = 'Alex Rodriguez') as customer_id,
    (SELECT id FROM services WHERE name = 'Cut & Wash') as service_id,
    CURRENT_DATE + INTERVAL '3 days' as appointment_date,
    '11:15'::time as appointment_time,
    'Prefers shorter length' as notes
  UNION ALL
  SELECT 
    (SELECT id FROM customers WHERE name = 'Lisa Thompson') as customer_id,
    (SELECT id FROM services WHERE name = 'Deep Treatment') as service_id,
    CURRENT_DATE + INTERVAL '4 days' as appointment_date,
    '13:00'::time as appointment_time,
    'Damaged hair, needs intensive care' as notes
  UNION ALL
  SELECT 
    (SELECT id FROM customers WHERE name = 'Sarah Johnson') as customer_id,
    (SELECT id FROM services WHERE name = 'Highlights') as service_id,
    CURRENT_DATE + INTERVAL '5 days' as appointment_date,
    '15:30'::time as appointment_time,
    'Touch up previous highlights' as notes
) as sample_data(customer_id, service_id, appointment_date, appointment_time, notes)
CROSS JOIN customers c
CROSS JOIN services s
WHERE c.id = sample_data.customer_id AND s.id = sample_data.service_id
ON CONFLICT DO NOTHING;
