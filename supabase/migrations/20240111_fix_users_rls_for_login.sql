DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role can view all users" ON users
    FOR SELECT USING (true);
