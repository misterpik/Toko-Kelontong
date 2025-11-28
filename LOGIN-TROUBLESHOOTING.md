# 🔧 Login Troubleshooting - dian@example.com

## 📊 Status User

✅ **User dian@example.com EXISTS dan AKTIF:**
- Email: dian@example.com
- Role: owner
- Tenant: Toko dian permata sari
- Last Login: **2025-11-27 06:45:21** (HARI INI!)
- Email Confirmed: ✅ YES

## 🤔 Analisa Masalah

User **baru saja login hari ini** (beberapa jam yang lalu), yang berarti:
1. ✅ Password pasti bekerja
2. ✅ Account tidak terkunci
3. ✅ RLS policies sudah bekerja (karena bisa login)

**Kemungkinan Penyebab:**
1. ❌ Password yang Anda coba BUKAN "password123"
2. ❌ Typo saat mengetik password
3. ❌ Caps Lock aktif
4. ❌ Spasi di awal/akhir password

## 🔑 Password yang Mungkin

Berdasarkan pattern user lain, coba password ini:

### Priority 1 (Most Likely):
1. `dian123`
2. `Dian123`
3. `dianpermatasari`

### Priority 2:
4. `password123`
5. `Password123`
6. `12345678`

### Priority 3:
7. `dian@example.com` (sama dengan email)
8. `dian`
9. `permatasari`

## ✅ Solusi Recommended

### Opsi 1: Test dengan User Lain yang Baru Login

Coba login dengan user yang baru login (kemungkinan password masih default):

#### **Cindy (Super Admin)** - Login kemarin
- **Email:** cindy@example.com
- **Password:** Coba: `cindy123`, `Cindy123`, `password123`
- **Last Login:** 2025-11-26 15:05

#### **Ely (Kasir)** - Login kemarin
- **Email:** ely@example.com
- **Password:** Coba: `ely123`, `Ely123`, `password123`
- **Last Login:** 2025-11-26 07:33

#### **Tinah (Kasir di Tenant Dian)** - Login 4 hari lalu
- **Email:** tinah@example.com
- **Password:** Coba: `tinah123`, `Tinah123`, `password123`
- **Last Login:** 2025-11-23 07:27
- **Tenant:** Toko dian permata sari (SAMA dengan Dian!)

### Opsi 2: Reset Password via Supabase Dashboard

1. Buka: https://supabase.com/dashboard/project/mnpwzieshyavgnmjveuq
2. Authentication > Users
3. Cari "dian@example.com"
4. Klik user > Reset Password
5. Set password baru: `password123`

### Opsi 3: Buat User Test Baru

1. Buka: http://localhost:5173/signup
2. Daftar dengan:
   - Email: `testdian@example.com`
   - Password: `password123`
3. Kemudian update role via SQL:

```sql
-- Get new user ID
SELECT id, email FROM auth.users WHERE email = 'testdian@example.com';

-- Update to owner role in tenant Dian
UPDATE public.users
SET 
  tenant_id = 'eb65c1ac-d740-4d91-85e4-df0a67386475',
  role = 'owner',
  full_name = 'Test Dian Owner'
WHERE user_id = 'USER_ID_FROM_ABOVE';
```

## 🎯 Quick Test Plan

### Test 1: Coba User Tinah (Recommended!)
```
Email: tinah@example.com
Password: password123 / tinah123 / Tinah123
Role: kasir
Tenant: Toko dian permata sari (SAMA dengan Dian!)
```

**Kenapa Tinah?**
- ✅ Baru login 4 hari lalu (password likely masih aktif)
- ✅ Di tenant yang SAMA dengan Dian
- ✅ Bisa test RLS policies untuk kasir

### Test 2: Coba User Cindy
```
Email: cindy@example.com
Password: password123 / cindy123 / Cindy123
Role: super_admin
```

**Kenapa Cindy?**
- ✅ Baru login kemarin
- ✅ Super admin (bisa lihat semua data)
- ✅ Good for testing RLS policies

### Test 3: Coba User Ely
```
Email: ely@example.com
Password: password123 / ely123 / Ely123
Role: kasir
```

## 🔍 Debug Steps

Jika masih gagal login, cek:

### 1. Browser Console
```javascript
// Buka Developer Tools (F12)
// Tab Console
// Lihat error message
```

### 2. Network Tab
```
// Buka Developer Tools (F12)
// Tab Network
// Coba login
// Lihat request ke /auth/v1/token
// Check response error
```

### 3. Supabase Logs
```
// Buka Supabase Dashboard
// Logs > Auth Logs
// Filter by email: dian@example.com
// Lihat error message
```

## 📝 Update Login Form untuk Better Error

Mari kita update LoginForm.tsx untuk menampilkan error yang lebih detail:

```typescript
// In LoginForm.tsx, update catch block:
catch (error: any) {
  console.error('Login error:', error);
  if (error.message) {
    setError(error.message);
  } else {
    setError("Email atau password salah");
  }
}
```

## ✅ Action Items

1. **COBA USER TINAH DULU** (paling likely berhasil)
   - Email: tinah@example.com
   - Password: password123

2. **Jika gagal**, coba Cindy atau Ely

3. **Jika semua gagal**, reset password via Dashboard

4. **Atau**, buat user test baru

---

**Status:** Investigating
**User:** dian@example.com
**Last Successful Login:** 2025-11-27 06:45:21 (TODAY!)
**Conclusion:** Password pasti bekerja, kemungkinan bukan "password123"
