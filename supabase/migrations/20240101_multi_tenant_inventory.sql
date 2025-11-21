CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'kasir');
CREATE TYPE payment_method AS ENUM ('cash', 'qris', 'ewallet');
CREATE TYPE payment_status AS ENUM ('lunas', 'belum_lunas', 'sebagian');

CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    subdomain text UNIQUE,
    status text NOT NULL DEFAULT 'active',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'owner';

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    barcode text,
    price numeric(12,2) NOT NULL,
    stock integer NOT NULL DEFAULT 0,
    min_stock integer DEFAULT 5,
    photo_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    contact text,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier_id uuid REFERENCES suppliers(id),
    total numeric(12,2) NOT NULL,
    payment_status payment_status DEFAULT 'belum_lunas',
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id),
    total numeric(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_received numeric(12,2),
    change_amount numeric(12,2),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id),
    quantity integer NOT NULL,
    price numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_tenant ON purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tenant data" ON tenants;
CREATE POLICY "Users can view own tenant data" ON tenants
    FOR SELECT USING (
        id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Super admin can manage all tenants" ON tenants;
CREATE POLICY "Super admin can manage all tenants" ON tenants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users WHERE user_id = auth.uid()::text AND role = 'super_admin')
    );

DROP POLICY IF EXISTS "Users can view own tenant products" ON products;
CREATE POLICY "Users can view own tenant products" ON products
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Owner can manage products" ON products;
CREATE POLICY "Owner can manage products" ON products
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role IN ('owner', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Users can view own tenant suppliers" ON suppliers;
CREATE POLICY "Users can view own tenant suppliers" ON suppliers
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Owner can manage suppliers" ON suppliers;
CREATE POLICY "Owner can manage suppliers" ON suppliers
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role IN ('owner', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Users can view own tenant purchases" ON purchases;
CREATE POLICY "Users can view own tenant purchases" ON purchases
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Owner can manage purchases" ON purchases;
CREATE POLICY "Owner can manage purchases" ON purchases
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role IN ('owner', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Users can view purchase items" ON purchase_items;
CREATE POLICY "Users can view purchase items" ON purchase_items
    FOR SELECT USING (
        purchase_id IN (
            SELECT id FROM purchases 
            WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Owner can manage purchase items" ON purchase_items;
CREATE POLICY "Owner can manage purchase items" ON purchase_items
    FOR ALL USING (
        purchase_id IN (
            SELECT id FROM purchases 
            WHERE tenant_id IN (
                SELECT tenant_id FROM public.users 
                WHERE user_id = auth.uid()::text AND role IN ('owner', 'super_admin')
            )
        )
    );

DROP POLICY IF EXISTS "Users can view own tenant sales" ON sales;
CREATE POLICY "Users can view own tenant sales" ON sales
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Users can create sales" ON sales;
CREATE POLICY "Users can create sales" ON sales
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
    );

DROP POLICY IF EXISTS "Users can view sale items" ON sale_items;
CREATE POLICY "Users can view sale items" ON sale_items
    FOR SELECT USING (
        sale_id IN (
            SELECT id FROM sales 
            WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
        )
    );

DROP POLICY IF EXISTS "Users can create sale items" ON sale_items;
CREATE POLICY "Users can create sale items" ON sale_items
    FOR INSERT WITH CHECK (
        sale_id IN (
            SELECT id FROM sales 
            WHERE tenant_id IN (SELECT tenant_id FROM public.users WHERE user_id = auth.uid()::text)
        )
    );
