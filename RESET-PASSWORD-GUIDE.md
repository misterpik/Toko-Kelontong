# 🔑 Reset Password Guide

## ❌ Masalah

User **dian@example.com** tidak bisa login dengan password "password123". Error: "Email atau password salah"

## 🔍 Diagnosis

User sudah ada di database:
- ✅ Email confirmed
- ✅ Ada di `auth.users`
- ✅ Ada di `public.users`
- ❌ Password tidak diketahui

## ✅ Solusi

### Opsi 1: Reset Password via Supabase Dashboard (Recommended)

1. **Buka Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/mnpwzieshyavgnmjveuq
   - Login dengan akun Supabase Anda

2. **Navigate ke Authentication:**
   - Klik "Authentication" di sidebar
   - Klik "Users"

3. **Cari user dian@example.com:**
   - Gunakan search box
   - Atau scroll untuk menemukan user

4. **Reset Password:**
   - Klik pada user "dian@example.com"
   - Klik tombol "..." (three dots)
   - Pilih "Reset Password"
   - Set password baru: `password123`
   - Atau gunakan "Send Password Reset Email"

### Opsi 2: Update Password via SQL

⚠️ **WARNING:** Ini akan mengupdate password langsung di database

```sql
-- Update password untuk dian@example.com
-- Password: password123
-- Hashed dengan bcrypt

UPDATE auth.users
SET encrypted_password = crypt('password123', gen_salt('bf'))
WHERE email = 'dian@example.com';
```

**Cara menjalankan:**
1. Buka Supabase SQL Editor
2. Paste query di atas
3. Run query
4. Test login lagi

### Opsi 3: Buat User Test Baru

Buat user baru dengan password yang kita tahu pasti:

```sql
-- 1. Insert ke auth.users (via Supabase Auth API lebih baik)
-- Gunakan Supabase Dashboard > Authentication > Users > Invite User

-- 2. Atau gunakan signup form di aplikasi
-- http://localhost:5173/signup
```

## 🧪 Test Password yang Mungkin

Coba password-password ini untuk user dian@example.com:

1. `password123` ❌ (sudah dicoba)
2. `Password123`
3. `dian123`
4. `Dian123`
5. `12345678`
6. Password yang sama dengan email: `dian@example.com`

## 📝 Membuat Test User Baru

### Via Signup Form

1. Buka: http://localhost:5173/signup
2. Isi form:
   - **Full Name:** Test Owner
   - **Email:** testowner@example.com
   - **Password:** password123
   - **Confirm Password:** password123
3. Submit
4. User akan dibuat dengan password yang kita tahu

### Via Supabase Dashboard

1. Buka Supabase Dashboard
2. Authentication > Users
3. Klik "Invite User"
4. Masukkan email: testowner@example.com
5. Set password: password123
6. Confirm

7. Tambahkan ke `public.users`:
```sql
INSERT INTO public.users (id, user_id, email, full_name, tenant_id, role)
VALUES (
  'AUTH_USER_ID_FROM_STEP_6',
  'AUTH_USER_ID_FROM_STEP_6',
  'testowner@example.com',
  'Test Owner',
  'eb65c1ac-d740-4d91-85e4-df0a67386475', -- Tenant Dian
  'owner'
);
```

## 🔧 Script Reset Password Otomatis

Saya akan membuat script untuk reset password:

```bash
# Coming soon: reset-password.js
node reset-password.js dian@example.com password123
```

## ✅ Verifikasi Setelah Reset

1. Buka: http://localhost:5173/login
2. Login dengan:
   - Email: dian@example.com
   - Password: password123 (atau password baru)
3. Harus berhasil login
4. Redirect ke /owner/dashboard

## 🎯 Recommended Action

**Gunakan Opsi 1** (Reset via Dashboard) karena:
- ✅ Paling aman
- ✅ Tidak perlu SQL manual
- ✅ Password di-hash dengan benar
- ✅ Audit trail lengkap

## 📞 Need Help?

Jika masih tidak bisa login setelah reset:
1. Check Supabase logs
2. Check browser console untuk error
3. Verify email confirmed
4. Check RLS policies masih aktif

---

**Status:** Waiting for password reset
**User:** dian@example.com
**Project:** mnpwzieshyavgnmjveuq
