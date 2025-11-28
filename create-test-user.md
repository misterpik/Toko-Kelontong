# 🆕 Membuat Test User Baru

## 🎯 Solusi Cepat

Karena password user existing tidak diketahui, mari kita buat user test baru dengan password yang kita tahu pasti.

## 📝 Langkah-langkah

### 1. Buka Signup Form

Buka di browser: **http://localhost:5173/signup**

### 2. Isi Form Signup

Gunakan data berikut:

**Test Owner:**
- **Full Name:** `Test Owner Dian`
- **Email:** `testowner@example.com`
- **Password:** `password123`
- **Confirm Password:** `password123`

**Test Kasir:**
- **Full Name:** `Test Kasir Dian`
- **Email:** `testkasir@example.com`
- **Password:** `password123`
- **Confirm Password:** `password123`

### 3. Submit Form

Klik tombol "Daftar" atau "Sign Up"

### 4. Tambahkan ke Tenant

Setelah user dibuat, kita perlu assign ke tenant dan set role:

```sql
-- Get the new user ID from auth.users
SELECT id, email FROM auth.users 
WHERE email IN ('testowner@example.com', 'testkasir@example.com');

-- Update public.users dengan tenant_id dan role
-- Ganti USER_ID_HERE dengan ID dari query di atas

-- For Test Owner
UPDATE public.users
SET 
  tenant_id = 'eb65c1ac-d740-4d91-85e4-df0a67386475', -- Tenant Dian
  role = 'owner',
  full_name = 'Test Owner Dian'
WHERE user_id = 'USER_ID_HERE';

-- For Test Kasir
UPDATE public.users
SET 
  tenant_id = 'eb65c1ac-d740-4d91-85e4-df0a67386475', -- Tenant Dian
  role = 'kasir',
  full_name = 'Test Kasir Dian'
WHERE user_id = 'USER_ID_HERE';
```

### 5. Test Login

Sekarang test login dengan:
- **Email:** testowner@example.com
- **Password:** password123

## 🚀 Alternatif: Gunakan User yang Sudah Ada

Coba login dengan user lain yang mungkin passwordnya masih default:

### User Sundari (Kasir)
- **Email:** sundari@example.com
- **Password:** Coba: `password123`, `sundari123`, `Sundari123`

### User Cindy (Super Admin)
- **Email:** cindy@example.com  
- **Password:** Coba: `password123`, `cindy123`, `Cindy123`

## 📊 Cek User yang Pernah Login

```sql
-- Cek user yang pernah login (kemungkinan password masih aktif)
SELECT 
    au.email,
    au.last_sign_in_at,
    pu.role,
    pu.full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id::text = pu.user_id
WHERE au.last_sign_in_at IS NOT NULL
ORDER BY au.last_sign_in_at DESC
LIMIT 10;
```

User yang pernah login baru-baru ini kemungkinan passwordnya masih diingat atau masih default.

## ✅ Recommended Flow

1. **Coba user lain dulu** (sundari, cindy, ely)
2. **Jika tidak berhasil**, buat user baru via signup
3. **Atau**, reset password via Supabase Dashboard

## 🔑 Password Patterns yang Mungkin

Berdasarkan naming convention, coba pattern ini:

- `password123` (default)
- `Password123` (dengan capital P)
- `[nama]123` (contoh: dian123, sundari123)
- `[Nama]123` (contoh: Dian123, Sundari123)
- `12345678` (simple password)

---

**Next Step:** Coba login dengan user lain atau buat user test baru
