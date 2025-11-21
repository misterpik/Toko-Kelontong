INSERT INTO tenants (id, name, subdomain, status) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Toko Kelontong Demo', 'demo', 'active')
ON CONFLICT (id) DO NOTHING;

UPDATE public.users 
SET tenant_id = '00000000-0000-0000-0000-000000000001',
    role = 'owner'
WHERE tenant_id IS NULL;

INSERT INTO products (tenant_id, name, barcode, price, stock, min_stock) VALUES
('00000000-0000-0000-0000-000000000001', 'Indomie Goreng', '8992388101015', 3000, 50, 10),
('00000000-0000-0000-0000-000000000001', 'Aqua 600ml', '8991234567890', 4000, 30, 15),
('00000000-0000-0000-0000-000000000001', 'Teh Pucuk Harum', '8992761111014', 5000, 25, 10),
('00000000-0000-0000-0000-000000000001', 'Minyak Goreng Bimoli 1L', '8992745111016', 18000, 8, 10),
('00000000-0000-0000-0000-000000000001', 'Gula Pasir 1kg', '8992745222027', 15000, 5, 10),
('00000000-0000-0000-0000-000000000001', 'Beras Premium 5kg', '8992745333038', 75000, 12, 5),
('00000000-0000-0000-0000-000000000001', 'Telur Ayam 1kg', '8992745444049', 28000, 20, 8),
('00000000-0000-0000-0000-000000000001', 'Susu Ultra Milk 1L', '8992745555050', 18000, 15, 10),
('00000000-0000-0000-0000-000000000001', 'Kopi Kapal Api', '8992745666061', 12000, 40, 15),
('00000000-0000-0000-0000-000000000001', 'Sabun Mandi Lifebuoy', '8992745777072', 8000, 25, 10)
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (tenant_id, name, contact, phone, address) VALUES
('00000000-0000-0000-0000-000000000001', 'PT Indofood', 'Budi Santoso', '081234567890', 'Jakarta Selatan'),
('00000000-0000-0000-0000-000000000001', 'CV Sumber Rejeki', 'Siti Aminah', '081234567891', 'Tangerang'),
('00000000-0000-0000-0000-000000000001', 'Toko Grosir Maju', 'Ahmad Yani', '081234567892', 'Bekasi')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  user_record RECORD;
  sale_id uuid;
  product_record RECORD;
  day_offset integer;
BEGIN
  FOR user_record IN 
    SELECT id, tenant_id FROM public.users 
    WHERE tenant_id = '00000000-0000-0000-0000-000000000001' 
    LIMIT 1
  LOOP
    FOR day_offset IN 0..6 LOOP
      FOR i IN 1..3 LOOP
        sale_id := gen_random_uuid();
        
        INSERT INTO sales (id, tenant_id, user_id, total, payment_method, payment_received, change_amount, created_at)
        VALUES (
          sale_id,
          user_record.tenant_id,
          user_record.id,
          (RANDOM() * 50000 + 10000)::numeric(12,2),
          CASE (RANDOM() * 3)::integer
            WHEN 0 THEN 'cash'
            WHEN 1 THEN 'qris'
            ELSE 'ewallet'
          END,
          (RANDOM() * 60000 + 10000)::numeric(12,2),
          (RANDOM() * 10000)::numeric(12,2),
          (NOW() - (day_offset || ' days')::interval + (RANDOM() * 12 || ' hours')::interval)
        );

        FOR product_record IN 
          SELECT id, price FROM products 
          WHERE tenant_id = user_record.tenant_id 
          ORDER BY RANDOM() 
          LIMIT (RANDOM() * 3 + 1)::integer
        LOOP
          INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
          VALUES (
            sale_id,
            product_record.id,
            (RANDOM() * 5 + 1)::integer,
            product_record.price,
            product_record.price * (RANDOM() * 5 + 1)::integer
          );
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
