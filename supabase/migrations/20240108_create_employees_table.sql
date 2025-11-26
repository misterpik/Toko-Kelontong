-- Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  position text DEFAULT 'kasir',
  status text DEFAULT 'active',
  hired_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- Enable RLS
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Owner can view employees in tenant" ON public.employees;
CREATE POLICY "Owner can view employees in tenant" ON public.employees
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Owner can manage employees" ON public.employees;
CREATE POLICY "Owner can manage employees" ON public.employees
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Employees can view own data" ON public.employees;
CREATE POLICY "Employees can view own data" ON public.employees
    FOR SELECT USING (
        user_id = auth.uid()::text
    );
