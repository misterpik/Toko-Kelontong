DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Authenticated users can view own data" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can insert own data" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Authenticated users can update own data" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = user_id);
