# 🏗️ RLS Architecture - Tabel Users

## 📊 System Status

```
✅ RLS Enabled: YES
✅ Policies Active: 6 policies
✅ Total Users: 20 users
✅ Active Tenants: 7 tenants
```

## 🔐 RLS Policy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PUBLIC.USERS TABLE                          │
│                     (RLS ENABLED ✅)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ SUPER ADMIN  │      │    OWNER     │     │    KASIR     │
│   (Cindy)    │      │    (Dian)    │     │  (Sundari)   │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ VIEW: ALL    │      │ VIEW: SAME   │     │ VIEW: SELF   │
│ TENANTS      │      │ TENANT ONLY  │     │ ONLY         │
│              │      │              │     │              │
│ MANAGE: ALL  │      │ MANAGE: SAME │     │ MANAGE: SELF │
│ USERS        │      │ TENANT USERS │     │ PROFILE ONLY │
└──────────────┘      └──────────────┘     └──────────────┘
```

## 🎯 Policy Flow Diagram

### Login Flow with RLS

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER LOGIN                                                    │
│    auth.signInWithPassword(email, password)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. AUTHENTICATION SUCCESS                                        │
│    ✅ JWT Token Created                                          │
│    ✅ auth.uid() = user_id                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. QUERY PUBLIC.USERS (CRITICAL!)                               │
│    SELECT tenant_id, role                                        │
│    FROM public.users                                             │
│    WHERE user_id = auth.uid()                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. RLS POLICY CHECK                                              │
│    Policy: "Users can view own data"                             │
│    Condition: user_id = auth.uid()::text                         │
│    Result: ✅ ALLOWED                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RETURN USER DATA                                              │
│    { user_id, email, role, tenant_id }                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. CHECK TENANT STATUS                                           │
│    SELECT status FROM tenants WHERE id = tenant_id               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. REDIRECT TO DASHBOARD                                         │
│    - super_admin → /superadmin/dashboard                         │
│    - owner → /owner/dashboard                                    │
│    - kasir → /kasir/dashboard                                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🔒 Policy Matrix

### SELECT Policies

| Policy Name | Role | Can View |
|-------------|------|----------|
| Users can view own data | ALL | ✅ Self |
| Super admin can view all users | super_admin | ✅ All users, all tenants |
| Owner can view tenant users | owner | ✅ Users in same tenant |

### ALL (INSERT/UPDATE/DELETE) Policies

| Policy Name | Role | Can Manage |
|-------------|------|------------|
| Super admin can manage all users | super_admin | ✅ All users, all tenants |
| Owner can manage tenant users | owner | ✅ Users in same tenant |

### UPDATE Policies

| Policy Name | Role | Can Update |
|-------------|------|------------|
| Users can update own profile | ALL | ✅ Own profile only |

## 🏢 Tenant Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT A                                 │
│                  (Toko dian permata sari)                        │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Owner   │  │ Kasir 1  │  │ Kasir 2  │  │ Kasir 3  │       │
│  │  (Dian)  │  │(Sundari) │  │(Elyana)  │  │  (Novi)  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│       │             │             │             │                │
│       └─────────────┴─────────────┴─────────────┘                │
│                     │                                            │
│              Owner can view all ✅                               │
│              Kasir can view self only ✅                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ RLS ISOLATION
                              │
┌─────────────────────────────────────────────────────────────────┐
│                         TENANT B                                 │
│                  (Toko Karyono Satrio)                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Owner   │  │ Kasir 1  │  │ Kasir 2  │                      │
│  │(Karyono) │  │ (Tini)   │  │(Nirmala) │                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
│       │             │             │                              │
│       └─────────────┴─────────────┘                              │
│                     │                                            │
│              Owner can view all ✅                               │
│              Kasir can view self only ✅                         │
└─────────────────────────────────────────────────────────────────┘

❌ Tenant A users CANNOT see Tenant B users
❌ Tenant B users CANNOT see Tenant A users
✅ Super Admin can see BOTH tenants
```

## 🔄 Data Access Patterns

### Pattern 1: User Views Own Data
```sql
-- User: sundari@example.com (kasir)
-- Auth: auth.uid() = '77663cc9-668a-4c21-a8d9-55b21838bbd7'

SELECT * FROM public.users WHERE user_id = auth.uid();

-- RLS Check:
-- Policy: "Users can view own data"
-- Condition: user_id = auth.uid()::text
-- Result: ✅ MATCH → Return 1 row
```

### Pattern 2: Owner Views Tenant Users
```sql
-- User: dian@example.com (owner)
-- Auth: auth.uid() = '995e9da8-1372-4bac-aaa2-ee97bd1621e5'
-- Tenant: 'eb65c1ac-d740-4d91-85e4-df0a67386475'

SELECT * FROM public.users;

-- RLS Check:
-- Policy 1: "Users can view own data" → ✅ Returns self
-- Policy 2: "Owner can view tenant users" → ✅ Returns same tenant users
-- Result: Returns 4 users (1 owner + 3 kasir in same tenant)
```

### Pattern 3: Super Admin Views All
```sql
-- User: cindy@example.com (super_admin)
-- Auth: auth.uid() = '219f72ab-e9be-4411-ac7c-21bd14781d34'

SELECT * FROM public.users;

-- RLS Check:
-- Policy 1: "Users can view own data" → ✅ Returns self
-- Policy 2: "Super admin can view all users" → ✅ Returns ALL users
-- Result: Returns 20 users (all tenants)
```

## 📈 Performance Considerations

### Index Usage
```sql
-- Existing indexes that help RLS performance:
CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_user_id ON public.users(user_id);

-- RLS policies use these indexes efficiently
```

### Query Performance
- ✅ `user_id = auth.uid()` → Uses primary key, very fast
- ✅ `tenant_id IN (SELECT ...)` → Uses index, fast
- ✅ `EXISTS (SELECT ...)` → Optimized by PostgreSQL

## 🛡️ Security Benefits

1. **Automatic Enforcement**
   - RLS policies applied at database level
   - Cannot be bypassed by application code
   - Works with any client (web, mobile, API)

2. **Tenant Isolation**
   - Data leakage prevention
   - Multi-tenant security
   - Compliance ready

3. **Role-Based Access**
   - Granular permissions
   - Principle of least privilege
   - Audit trail ready

4. **Defense in Depth**
   - Multiple policy layers
   - Fail-safe defaults
   - Explicit permissions

## 🎯 Best Practices Applied

✅ **Principle of Least Privilege**
- Users only see what they need
- Kasir limited to own data
- Owner limited to own tenant

✅ **Defense in Depth**
- Multiple policies for different scenarios
- Overlapping protections
- Explicit allow lists

✅ **Fail-Safe Defaults**
- RLS enabled by default
- Deny by default
- Explicit permissions required

✅ **Separation of Concerns**
- Authentication (Supabase Auth)
- Authorization (RLS Policies)
- Application Logic (React)

## 📚 References

- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Multi-tenancy: https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy

---

**Last Updated:** 2024-11-27
**Status:** ✅ Production Ready
**Project:** Toko Kelontong Multi-Tenant POS
