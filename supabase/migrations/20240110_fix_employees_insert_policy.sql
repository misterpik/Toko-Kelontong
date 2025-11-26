-- Fix INSERT policy for employees table
-- The issue: owner is inserting employee with different user_id (the new cashier's id)
-- Solution: Only check tenant_id matches owner's tenant, don't check user_id on insert

DROP POLICY IF EXISTS "Owner can insert employees" ON public.employees;

CREATE POLICY "Owner can insert employees" ON public.employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE user_id = auth.uid()::text 
            AND role = 'owner'
            AND tenant_id = employees.tenant_id
        )
    );
