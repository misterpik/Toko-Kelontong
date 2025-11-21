UPDATE public.users 
SET tenant_id = '00000000-0000-0000-0000-000000000001',
    role = 'owner'
WHERE tenant_id IS NULL AND user_id IS NOT NULL;