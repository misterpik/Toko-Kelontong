# ✅ FIXED: Kelola Kasir - Daftar Kasir Kosong

## ❌ Masalah

Pada halaman **Kelola Kasir**, kasir yang sudah ditambahkan melalui dialog "Tambah Kasir Baru" tidak muncul di Daftar Kasir.

### Root Cause Analysis

1. **Tabel `employees` kosong** - tidak ada data sama sekali
2. **Data kasir sebenarnya ada di tabel `users`** dengan `role = 'kasir'`
3. **Aplikasi load dari tabel `employees`** tapi insert mungkin gagal karena RLS
4. **Duplikasi data** - kasir disimpan di 2 tempat (`users` dan `employees`)
5. **RLS policies di `employees`** mungkin memiliki masalah recursion seperti sebelumnya

### Database State

```sql
-- employees table: EMPTY (0 rows)
SELECT COUNT(*) FROM employees;
-- Result: 0

-- users table: HAS KASIR DATA (10+ kasir)
SELECT COUNT(*) FROM users WHERE role = 'kasir';
-- Result: 10
```

## ✅ Solusi yang Diterapkan

### Approach: Use `users` Table Only

Simplified architecture - kasir data hanya disimpan di tabel `users`:

**Before:**
```
users (role='kasir') + employees (position='kasir')
↓
Duplikasi data, kompleks, prone to sync issues
```

**After:**
```
users (role='kasir') ONLY
↓
Single source of truth, simple, reliable
```

### 1. Created PostgreSQL Function

**Function:** `get_tenant_kasir(tenant_uuid UUID)`

```sql
CREATE FUNCTION get_tenant_kasir(tenant_uuid UUID)
RETURNS TABLE (
    user_id TEXT,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ
)
SECURITY DEFINER
```

**Features:**
- ✅ Bypass RLS dengan SECURITY DEFINER
- ✅ Hanya owner tenant yang bisa akses
- ✅ Return kasir dari tabel `users`
- ✅ No recursion issues

### 2. Updated Component

**File:** `src/components/pages/owner/kelola-kasir.tsx`

**Changes:**

#### Load Kasir
```typescript
// Before: Load from employees table
const { data } = await supabase
  .from('employees')
  .select('*')
  .eq('tenant_id', tenantId);

// After: Use RPC function
const { data } = await supabase
  .rpc('get_tenant_kasir', { tenant_uuid: tenantId });
```

#### Add Kasir
```typescript
// Before: Insert to both users and employees
await supabase.from('users').update(...);
await supabase.from('employees').insert(...);

// After: Update users table only
await supabase.from('users').update({
  role: 'kasir',
  tenant_id: ownerData.tenant_id,
  full_name: formData.full_name,
});
```

#### Delete Kasir
```typescript
// Before: Delete from both tables
await supabase.from('employees').delete();
await supabase.from('users').delete();

// After: Delete from auth (cascades to users)
await supabase.auth.admin.deleteUser(userId);
```

## 📊 Data Architecture

### Users Table (Single Source of Truth)

```sql
users
├── id (uuid)
├── user_id (text) - auth.users.id
├── email (text)
├── full_name (text)
├── tenant_id (uuid) → references tenants(id)
├── role (user_role) → 'owner', 'kasir', 'super_admin'
├── created_at (timestamptz)
└── updated_at (timestamptz)
```

### Employees Table (Deprecated for Kasir)

```sql
employees
├── Status: EMPTY
├── Usage: Not used for kasir anymore
└── Note: Can be used for other employee types in future
```

### Why This is Better

| Aspect | Before | After |
|--------|--------|-------|
| Data Storage | 2 tables (users + employees) | 1 table (users only) |
| Sync Issues | Possible | None |
| RLS Complexity | High (2 tables) | Low (1 table) |
| Query Performance | 2 queries | 1 RPC call |
| Maintenance | Complex | Simple |

## 🔧 Migration Applied

```sql
-- Migration: create_owner_functions
-- Created function: get_tenant_kasir(UUID)
-- Status: ✅ Applied successfully
```

## ✅ Result

### Before
```
Daftar Kasir (0)
[Empty state - "Belum ada kasir yang ditambahkan"]
```

### After
```
Daftar Kasir (10)
┌─────────────────────┬──────────────────────┬───────────┬──────────────┐
│ Nama                │ Email                │ Telepon   │ Tgl Bergabung│
├─────────────────────┼──────────────────────┼───────────┼──────────────┤
│ Elma Kasir Rianto   │ elma@example.com     │ -         │ 28 Nov 2025  │
│ Tinah Kasir Dian    │ tinah@example.com    │ -         │ 23 Nov 2025  │
│ Juwita Kasir Dian   │ juwita@example.com   │ -         │ 23 Nov 2025  │
│ ...                 │ ...                  │ ...       │ ...          │
└─────────────────────┴──────────────────────┴───────────┴──────────────┘
```

## 🎯 Features

### Owner Can Now:
- ✅ View all kasir in their tenant
- ✅ Add new kasir (creates auth user + updates users table)
- ✅ Delete kasir (removes from auth + users)
- ✅ See kasir count
- ✅ See kasir details (name, email, join date)

### Security:
- ✅ Function checks if caller is owner of tenant
- ✅ Uses SECURITY DEFINER to bypass RLS safely
- ✅ Only owner can access their tenant's kasir
- ✅ Kasir cannot see other kasir

## 🧪 Test

### 1. Login as Owner

```
Email: dian@example.com (or any owner)
Password: [your password]
```

### 2. Navigate to Kelola Kasir

```
Dashboard > Kelola Kasir
```

### 3. Verify Existing Kasir

- ✅ Should see list of existing kasir
- ✅ Count should match actual kasir in tenant
- ✅ Data should display correctly

### 4. Add New Kasir

1. Click "Tambah Kasir"
2. Fill form:
   - Nama: Test Kasir
   - Email: testkasir@example.com
   - Password: password123
3. Submit
4. ✅ Should see success message
5. ✅ New kasir should appear in list immediately

### 5. Delete Kasir

1. Click trash icon on a kasir
2. Confirm deletion
3. ✅ Should see success message
4. ✅ Kasir should disappear from list

## 📝 Notes

### Why Not Use Employees Table?

**Pros of using `users` only:**
- ✅ Single source of truth
- ✅ No sync issues
- ✅ Simpler code
- ✅ Easier to maintain
- ✅ Consistent with auth system

**Cons of using `employees`:**
- ❌ Duplicate data
- ❌ Sync complexity
- ❌ RLS policy issues
- ❌ More queries needed
- ❌ Prone to inconsistency

### What About Phone and Address?

Currently, `users` table doesn't have `phone` and `address` columns. Options:

**Option 1:** Add columns to `users` table (recommended)
```sql
ALTER TABLE users 
ADD COLUMN phone TEXT,
ADD COLUMN address TEXT;
```

**Option 2:** Use `employees` table for extended info only
- Store basic info in `users`
- Store extended info (phone, address) in `employees`
- Join when needed

**Option 3:** Use JSON column in `users`
```sql
ALTER TABLE users 
ADD COLUMN metadata JSONB;
```

For now, phone and address will show as "-" in the list.

## 🚀 Next Steps (Optional)

### 1. Add Phone & Address to Users Table

```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;
```

### 2. Update Function to Return Phone & Address

```sql
CREATE OR REPLACE FUNCTION get_tenant_kasir(tenant_uuid UUID)
...
SELECT 
    u.user_id,
    u.email,
    u.full_name,
    u.phone,  -- Now from users table
    u.address, -- Now from users table
    u.created_at
FROM users u
...
```

### 3. Update Add Kasir to Save Phone & Address

```typescript
await supabase.from('users').update({
  role: 'kasir',
  tenant_id: ownerData.tenant_id,
  full_name: formData.full_name,
  phone: formData.phone,      // Add this
  address: formData.address,  // Add this
});
```

---

**Status:** ✅ FIXED
**Issue:** Kasir tidak muncul di Daftar Kasir
**Solution:** Use users table only, created RPC function for owner
**Migration:** create_owner_functions
**Result:** Kasir list now displays correctly!
