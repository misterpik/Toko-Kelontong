# 🚀 Quick Reference - Test Login

## ⚡ Quick Start

### Browser Test (Fastest)
```bash
# 1. Open test-login.html in browser
# 2. Enter credentials when prompted:
#    URL: https://mnpwzieshyavgnmjveuq.supabase.co
#    KEY: (from .env file)
# 3. Click account card to test
```

### Automated Test
```bash
npm run test:login
```

### Manual Test
```bash
npm run dev
# Login at http://localhost:5173
```

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | cindy@example.com | password123 |
| Owner | dian@example.com | password123 |
| Kasir | sundari@example.com | password123 |

## ✅ Expected Results

### Super Admin
- ✅ Login successful
- ✅ Can view 10+ users (all tenants)
- ✅ Redirect to /superadmin/dashboard

### Owner
- ✅ Login successful
- ✅ Can view 4-5 users (same tenant)
- ✅ Redirect to /owner/dashboard

### Kasir
- ✅ Login successful
- ✅ Can view 1 user (self only)
- ✅ Redirect to /kasir/dashboard

## 🐛 Quick Troubleshooting

### "Gagal memuat data user"
```sql
-- Check policy exists
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can view own data';
```

### "Invalid login credentials"
- Default password: `password123`
- Check Supabase Auth dashboard
- Reset password if needed

### RLS not working
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
-- Should return: rowsecurity = true
```

## 📊 Quick Verification

```sql
-- Check everything is working
SELECT 
    'RLS Enabled' as check_type,
    CASE WHEN rowsecurity THEN '✅' ELSE '❌' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users'
UNION ALL
SELECT 'Policy Count', COUNT(*)::text || ' policies'
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| test-login.html | Interactive browser test |
| test-login.js | Automated Node.js test |
| TEST-LOGIN-GUIDE.md | Full testing guide |
| SUMMARY-RLS-IMPLEMENTATION.md | Implementation summary |
| RLS-ARCHITECTURE.md | Architecture diagrams |

## 🔗 Quick Links

- **Migration:** `supabase/migrations/20241127_add_users_rls_policies.sql`
- **Auth Logic:** `supabase/auth.tsx`
- **Project:** https://mnpwzieshyavgnmjveuq.supabase.co

## 💡 One-Liner Commands

```bash
# Run test
npm run test:login

# Start dev server
npm run dev

# Generate types
npm run types:supabase

# Build
npm run build
```

## 🎯 Success Checklist

- [ ] RLS enabled on users table
- [ ] 6 policies active
- [ ] All 3 roles can login
- [ ] No "Gagal memuat data user" error
- [ ] Tenant isolation working
- [ ] Role-based access working

## 📞 Need Help?

1. Read `TEST-LOGIN-GUIDE.md`
2. Run `npm run test:login`
3. Check Supabase logs
4. Verify policies with SQL

---

**Status:** ✅ Ready to Test
**Date:** 2024-11-27
