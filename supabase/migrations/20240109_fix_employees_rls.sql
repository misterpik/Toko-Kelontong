-- Fix RLS policies for employees table to allow owner to insert

-- Drop existing policies
DROP POLICY IF EXISTS "Owner can view employees in tenant" ON public.employees;
DROP POLICY IF EXISTS "Owner can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view own data" ON public.employees;

-- Create new policies with proper permissions
CREATE POLICY "Owner can view employees in tenant" ON public.employees
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

CREATE POLICY "Owner can insert employees" ON public.employees
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

CREATE POLICY "Owner can update employees" ON public.employees
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

CREATE POLICY "Owner can delete employees" ON public.employees
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users 
            WHERE user_id = auth.uid()::text AND role = 'owner'
        )
    );

CREATE POLICY "Employees can view own data" ON public.employees
    FOR SELECT USING (
        user_id = auth.uid()::text
    );
