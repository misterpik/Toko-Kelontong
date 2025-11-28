# 🧪 Test Login - Quick Start Guide

## 📦 File yang Dibuat

1. **test-login.html** - Interactive browser-based test
2. **test-login.js** - Node.js automated test script
3. **TEST-LOGIN-GUIDE.md** - Comprehensive testing documentation

## 🚀 Cara Menjalankan Test

### Opsi 1: Browser Test (Recommended untuk Visual Testing)

1. Buka file `test-login.html` di browser
2. Masukkan credentials Supabase saat diminta:
   - **SUPABASE_URL:** `https://mnpwzieshyavgnmjveuq.supabase.co`
   - **SUPABASE_ANON_KEY:** (copy dari file `.env`)
3. Klik salah satu account card untuk test:
   - 🔴 Super Admin (Cindy)
   - 🟢 Owner (Dian)
   - 🔵 Kasir (Sundari)
4. Lihat hasil test secara real-time di bagian "Test Results"

**Keuntungan:**
- Visual dan interaktif
- Real-time logging
- Mudah untuk demo
- Tidak perlu install dependencies

### Opsi 2: Node.js Automated Test

1. Pastikan file `.env` sudah ada dengan credentials:
   ```env
   VITE_SUPABASE_URL=https://mnpwzieshyavgnmjveuq.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Install dependencies (jika belum):
   ```bash
   npm install
   ```

3. Jalankan test:
   ```bash
   npm run test:login
   ```

**Keuntungan:**
- Automated testing
- Bisa diintegrasikan ke CI/CD
- Colored console output
- Test semua account sekaligus

### Opsi 3: Manual Test di Aplikasi

1. Jalankan development server:
   ```bash
   npm run dev
   ```

2. Buka browser ke `http://localhost:5173`

3. Login dengan salah satu test account:
   - **Super Admin:** cindy@example.com / password123
   - **Owner:** dian@example.com / password123
   - **Kasir:** sundari@example.com / password123

4. Verifikasi:
   - ✅ Login berhasil tanpa error
   - ✅ Redirect ke dashboard yang sesuai
   - ✅ Data ditampilkan dengan benar

## 🎯 Apa yang Ditest?

### 1. Authentication Flow
- User bisa login dengan credentials yang benar
- Auth token dibuat dengan sukses

### 2. RLS Policy - "Users can view own data"
- User bisa query data mereka sendiri dari `public.users`
- Query `SELECT * FROM users WHERE user_id = auth.uid()` berhasil
- **Ini adalah test PALING PENTING!**

### 3. Tenant Status Check
- System bisa query tenant status
- Inactive tenant ditolak login

### 4. Role-Based Access
- **Super Admin:** Bisa lihat semua user di semua tenant
- **Owner:** Bisa lihat user di tenant yang sama saja
- **Kasir:** Hanya bisa lihat data sendiri

### 5. Tenant Isolation
- User di tenant A tidak bisa lihat user di tenant B
- RLS policy enforce isolation dengan benar

## ✅ Expected Results

### Super Admin (cindy@example.com)
```
✅ Login successful
✅ Can query own data
✅ Can view 10+ users (all tenants)
✅ Can see users from different tenants
✅ Redirect to /superadmin/dashboard
```

### Owner (dian@example.com)
```
✅ Login successful
✅ Can query own data
✅ Can view 4-5 users (same tenant only)
✅ Cannot see users from other tenants
✅ Redirect to /owner/dashboard
```

### Kasir (sundari@example.com)
```
✅ Login successful
✅ Can query own data
✅ Can view only 1 user (self)
✅ Cannot see other users
✅ Redirect to /kasir/dashboard
```

## 🐛 Common Issues

### Issue 1: "Gagal memuat data user"

**Penyebab:** RLS policy tidak mengizinkan user query data sendiri

**Solusi:**
```sql
-- Verifikasi policy ada
SELECT * FROM pg_policies 
WHERE tablename = 'users' 
AND policyname = 'Users can view own data';

-- Jika tidak ada, jalankan migration
```

### Issue 2: SUPABASE_ANON_KEY tidak ditemukan

**Solusi:**
1. Buka file `.env`
2. Copy value dari `VITE_SUPABASE_ANON_KEY`
3. Paste saat diminta di browser test

### Issue 3: "Invalid login credentials"

**Solusi:**
- Password default: `password123`
- Jika tidak work, cek di Supabase Auth dashboard
- Reset password jika perlu

## 📊 Test Output Example

```
=============================================================
Testing: Dian (Owner)
=============================================================
1️⃣  Signing out previous session...
2️⃣  Signing in as dian@example.com...
✅ Authentication successful!
   User ID: 995e9da8-1372-4bac-aaa2-ee97bd1621e5
3️⃣  Querying public.users table (RLS Policy Test)...
✅ RLS Policy working! User can query own data.
   Role: owner
   Tenant ID: eb65c1ac-d740-4d91-85e4-df0a67386475
✅ Role verification passed: owner
4️⃣  Checking tenant status...
✅ Tenant: Toko dian permata sari (active)
5️⃣  Testing user list access (based on role)...
✅ Can view 4 users
   - Same tenant: 4
   - Different tenant: 0
✅ Owner can only see users in same tenant
🎉 Test completed!
```

## 📝 Test Accounts Reference

| Role | Email | Password | Tenant | User ID |
|------|-------|----------|--------|---------|
| Super Admin | cindy@example.com | password123 | Toko cindy permata sari | 219f72ab-e9be-4411-ac7c-21bd14781d34 |
| Owner | dian@example.com | password123 | Toko dian permata sari | 995e9da8-1372-4bac-aaa2-ee97bd1621e5 |
| Kasir | sundari@example.com | password123 | Toko dian permata sari | 77663cc9-668a-4c21-a8d9-55b21838bbd7 |

## 🔗 Related Files

- **Migration:** `supabase/migrations/20241127_add_users_rls_policies.sql`
- **Auth Logic:** `supabase/auth.tsx`
- **App Routes:** `src/App.tsx`
- **Full Guide:** `TEST-LOGIN-GUIDE.md`

## 💡 Tips

1. **Test di browser dulu** untuk visual feedback
2. **Gunakan Node.js test** untuk automated testing
3. **Baca TEST-LOGIN-GUIDE.md** untuk detail lengkap
4. **Check console logs** jika ada error
5. **Verify di Supabase dashboard** jika perlu

## 🎉 Success Criteria

Test berhasil jika:
- ✅ Semua 3 role bisa login
- ✅ Tidak ada error "Gagal memuat data user"
- ✅ User bisa query data sendiri
- ✅ Tenant isolation berfungsi
- ✅ Role-based access berfungsi

---

**Need Help?** Baca `TEST-LOGIN-GUIDE.md` untuk troubleshooting lengkap.
