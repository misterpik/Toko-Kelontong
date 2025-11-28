# 🧪 Panduan Test Login RLS Policies

## 📋 Ringkasan

Dokumen ini berisi panduan untuk melakukan test login setelah implementasi RLS policies pada tabel `public.users`.

## 🎯 Tujuan Test

1. Memverifikasi bahwa user bisa login dengan sukses
2. Memverifikasi bahwa user bisa query data mereka sendiri dari tabel `public.users`
3. Memverifikasi bahwa RLS policies bekerja sesuai role (super_admin, owner, kasir)
4. Memverifikasi tenant isolation berfungsi dengan baik

## 🔐 Test Accounts

### Super Admin
- **Email:** cindy@example.com
- **Password:** password123
- **Role:** super_admin
- **Tenant:** Toko cindy permata sari
- **Expected Behavior:**
  - ✅ Bisa login
  - ✅ Bisa lihat data sendiri
  - ✅ Bisa lihat SEMUA user di SEMUA tenant
  - ✅ Bisa manage semua user

### Owner
- **Email:** dian@example.com
- **Password:** password123
- **Role:** owner
- **Tenant:** Toko dian permata sari (tenant_id: eb65c1ac-d740-4d91-85e4-df0a67386475)
- **Expected Behavior:**
  - ✅ Bisa login
  - ✅ Bisa lihat data sendiri
  - ✅ Bisa lihat user di tenant yang SAMA saja
  - ✅ Bisa manage user di tenant yang sama (tambah/edit/hapus kasir)
  - ❌ TIDAK bisa lihat user di tenant lain

### Kasir
- **Email:** sundari@example.com
- **Password:** password123
- **Role:** kasir
- **Tenant:** Toko dian permata sari (tenant_id: eb65c1ac-d740-4d91-85e4-df0a67386475)
- **Expected Behavior:**
  - ✅ Bisa login
  - ✅ Bisa lihat data sendiri
  - ✅ Bisa update profil sendiri
  - ❌ TIDAK bisa lihat user lain (bahkan di tenant yang sama)
  - ❌ TIDAK bisa manage user lain

## 🚀 Cara Test

### Metode 1: Menggunakan Test HTML File

1. Buka file `test-login.html` di browser
2. Masukkan credentials Supabase:
   - **SUPABASE_URL:** `https://mnpwzieshyavgnmjveuq.supabase.co`
   - **SUPABASE_ANON_KEY:** (dari file .env)
3. Klik salah satu account card untuk test login
4. Lihat hasil test di bagian "Test Results"

### Metode 2: Menggunakan Aplikasi Langsung

1. Jalankan aplikasi development server:
   ```bash
   npm run dev
   ```

2. Buka browser ke `http://localhost:5173`

3. Test login dengan credentials di atas

4. Verifikasi:
   - User berhasil login tanpa error
   - User diarahkan ke dashboard yang sesuai dengan role
   - Dashboard menampilkan data yang sesuai

### Metode 3: Menggunakan Supabase SQL Editor

Test manual menggunakan SQL:

```sql
-- Simulate login as owner (dian@example.com)
-- Set the auth context
SELECT set_config('request.jwt.claims', 
  '{"sub": "995e9da8-1372-4bac-aaa2-ee97bd1621e5"}', 
  true);

-- Test: User should be able to see their own data
SELECT * FROM public.users 
WHERE user_id = '995e9da8-1372-4bac-aaa2-ee97bd1621e5';
-- Expected: 1 row returned ✅

-- Test: Owner should see users in same tenant
SELECT * FROM public.users 
WHERE tenant_id = 'eb65c1ac-d740-4d91-85e4-df0a67386475';
-- Expected: Multiple rows (owner + kasir in same tenant) ✅

-- Test: Owner should NOT see users in other tenant
SELECT * FROM public.users 
WHERE tenant_id = 'dda22728-7e9c-4d38-8f11-3a3f8845e511';
-- Expected: 0 rows ❌
```

## ✅ Checklist Test

### Test 1: Super Admin Login
- [ ] Login berhasil
- [ ] Bisa query data sendiri dari `public.users`
- [ ] Bisa lihat semua user (count > 10)
- [ ] Bisa lihat user dari berbagai tenant
- [ ] Redirect ke `/superadmin/dashboard`

### Test 2: Owner Login
- [ ] Login berhasil
- [ ] Bisa query data sendiri dari `public.users`
- [ ] Bisa lihat user di tenant yang sama
- [ ] TIDAK bisa lihat user di tenant lain
- [ ] Redirect ke `/owner/dashboard`
- [ ] Halaman "Kelola Kasir" menampilkan kasir di tenant yang sama

### Test 3: Kasir Login
- [ ] Login berhasil
- [ ] Bisa query data sendiri dari `public.users`
- [ ] HANYA bisa lihat data sendiri (count = 1)
- [ ] Redirect ke `/kasir/dashboard`

### Test 4: Tenant Isolation
- [ ] User di tenant A tidak bisa lihat data user di tenant B
- [ ] Query dengan tenant_id lain return 0 rows
- [ ] RLS policy enforce tenant isolation

### Test 5: Role-Based Access
- [ ] Super admin bisa CRUD semua user
- [ ] Owner bisa CRUD user di tenant sendiri
- [ ] Kasir hanya bisa READ data sendiri
- [ ] Kasir bisa UPDATE profil sendiri

## 🐛 Troubleshooting

### Error: "Gagal memuat data user"

**Penyebab:** RLS policy tidak mengizinkan user query data sendiri

**Solusi:**
```sql
-- Cek apakah policy "Users can view own data" ada
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can view own data';

-- Jika tidak ada, jalankan migration lagi
```

### Error: "Row Level Security Policy Violation"

**Penyebab:** User mencoba akses data yang tidak diizinkan oleh RLS policy

**Solusi:** Ini adalah behavior yang DIHARAPKAN untuk tenant isolation

### Login Berhasil tapi Redirect ke Home

**Penyebab:** Data user tidak ditemukan di `public.users`

**Solusi:**
```sql
-- Cek apakah user ada di public.users
SELECT * FROM public.users WHERE user_id = 'AUTH_USER_ID';

-- Jika tidak ada, insert user
INSERT INTO public.users (id, user_id, email, full_name, tenant_id, role)
VALUES (
  'AUTH_USER_ID',
  'AUTH_USER_ID', 
  'email@example.com',
  'Full Name',
  'TENANT_ID',
  'owner'
);
```

## 📊 Expected Results Summary

| Role | View Own Data | View Same Tenant | View All Tenants | Manage Users |
|------|--------------|------------------|------------------|--------------|
| Super Admin | ✅ | ✅ | ✅ | ✅ All |
| Owner | ✅ | ✅ | ❌ | ✅ Same Tenant |
| Kasir | ✅ | ❌ | ❌ | ❌ (Only self update) |

## 🔍 Verification Queries

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
-- Expected: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';
-- Expected: 6 policies

-- Check user count per tenant
SELECT 
  t.name as tenant_name,
  COUNT(u.id) as user_count,
  STRING_AGG(u.role::text, ', ') as roles
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY user_count DESC;
```

## 📝 Notes

- Password default untuk semua test account: `password123`
- Jika password berbeda, cek di Supabase Auth dashboard
- Test dilakukan pada project: `mnpwzieshyavgnmjveuq`
- Migration file: `20241127_add_users_rls_policies.sql`

## 🎉 Success Criteria

Test dianggap berhasil jika:
1. ✅ Semua role bisa login tanpa error
2. ✅ User bisa query data sendiri dari `public.users`
3. ✅ Tenant isolation berfungsi (owner tidak bisa lihat user tenant lain)
4. ✅ Role-based access berfungsi (kasir hanya lihat data sendiri)
5. ✅ Redirect ke dashboard yang sesuai dengan role
6. ✅ Tidak ada error "Gagal memuat data user"

---

**Last Updated:** 2024-11-27
**Project:** Toko Kelontong Multi-Tenant POS
**Database:** mnpwzieshyavgnmjveuq.supabase.co
