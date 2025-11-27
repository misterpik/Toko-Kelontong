ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Service role can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read all users in same tenant" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update own data" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own record" ON public.users
    FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own record" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own record" ON public.users
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);
