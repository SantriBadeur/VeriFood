# SisaBerkah - User Registration & Password Reset Design Document

**Date:** 2026-11-10  
**Status:** Approved by Builder Review (Pending User Approval)  
**Author:** Pair Programming (User & AI)  

---

## 1. Executive Summary & Intent

### 1.1 Intent
Expand SisaBerkah's authentication system to enable:
1. **Public Volunteer Self-Registration**: Allow new field volunteers to register an account directly from the login/auth screens without requiring manual admin pre-creation.
2. **Self-Service Password Reset**: Enable volunteers and administrators to recover access to their accounts via secure, time-limited reset tokens and automated notifications with development fallback.

### 1.2 The "Why"
Previously, all user accounts had to be provisioned manually by an Administrator via `/pengguna`. In operational field situations, new volunteers joining food rescue drives need a friction-free way to sign up. Additionally, if an admin or volunteer forgot their password, there was no recovery mechanism other than direct database intervention. Providing registration and password reset directly from the login page resolves operational bottlenecks while upholding strict RBAC and security standards.

---

## 2. Goals, Non-Goals, and Anti-Goals

### 2.1 Goals
- **Dedicated Responsive UI**: Clean, accessible auth views matching SisaBerkah's Emerald/Amber floating island theme:
  - `/register` for volunteer sign-up.
  - `/forgot-password` for requesting password reset.
  - `/reset-password?token=XYZ` for setting a new password.
  - Updated `/login` with clear links to register and reset password.
- **Strict RBAC Safety**: Public registration must strictly enforce `role = RELAWAN`. Nobody can self-register as `ADMIN`.
- **Cryptographically Secure Tokens**: Password reset tokens must be 256-bit random hex strings (`crypto.randomBytes(32)`), stored in the database with strict expiration (60 minutes) and single-use invalidation (`usedAt`).
- **Enumeration Attack Protection**: The forgot password endpoint must not reveal whether an email exists in the database.
- **Zero-Friction Local Testing (Hybrid Mailer)**: If SMTP environment variables are present, dispatch an email; if running locally without SMTP configured, output the reset link to the server console and provide a dev-mode preview link in the response/UI.
- **Audit Trail Accountability**: All registrations and password resets must record structured entries in `AuditLog`.

### 2.2 Non-Goals
- Public registration for `ADMIN` roles (admins must still be managed by existing admins).
- Complex SMS / OTP multi-factor authentication.
- Social OAuth logins (Google, Facebook).

### 2.3 Anti-Goals
- **No Privilege Escalation**: Never accept a client-provided `role` payload in the public registration endpoint.
- **No Infinite Token Validity**: Never allow a reset token to be reused or used after its expiration time.
- **No Raw Password Storage**: Passwords must always be hashed with bcrypt (salt rounds = 10).

---

## 3. Approaches Considered

### 3.1 Option A: Dedicated Multi-Page Flow (Selected)
- **Description**: Independent routes (`/register`, `/forgot-password`, `/reset-password`) sharing the existing layout styling, backed by a new Prisma model `PasswordResetToken` and dedicated API endpoints.
- **Pros**: Standards-compliant, modular Next.js App Router structure, distinct bookmarkable/testable URLs, clean separation of concerns.
- **Cons**: Requires creating 3 new page files and their corresponding API route handlers.
- **Status**: **SELECTED** by user choice.

### 3.2 Option B: Single-Page Modal / Tab Switching on `/login`
- **Description**: Toggling between "Masuk", "Daftar", and "Lupa Password" inside `/login` via React state.
- **Pros**: No URL redirection.
- **Cons**: Cluttered state management, difficult deep-linking from reset emails (`/reset-password?token=...` still requires route/query handling), less accessible.
- **Status**: Rejected.

---

## 4. Detailed Technical Specification

### 4.1 Database Schema Changes (`prisma/schema.prisma`)

Add the `PasswordResetToken` model and update `User`:

```prisma
model User {
  // Existing fields...
  id                      String               @id @default(uuid())
  email                   String               @unique
  name                    String
  passwordHash            String
  role                    Role                 @default(RELAWAN)
  isActive                Boolean              @default(true)
  createdAt               DateTime             @default(now())
  updatedAt               DateTime             @updatedAt

  // Existing relations...
  foodEntries             FoodStock[]          @relation("FoodCreatedBy")
  createdDistributions    Distribution[]       @relation("DistributionCreatedBy")
  assignedDistributions   Distribution[]       @relation("DistributionAssignedTo")
  dispatchedDistributions Distribution[]       @relation("DistributionDispatchedBy")
  deliveredDistributions  Distribution[]       @relation("DistributionDeliveredBy")
  auditLogs               AuditLog[]

  // New relation
  passwordResetTokens     PasswordResetToken[]
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([token])
  @@index([userId])
}
```

### 4.2 Backend Business Services (`src/services/auth.service.ts`)

#### 1. `registerVolunteer(input: { name: string; email: string; password: string })`
- Normalize email (`email.trim().toLowerCase()`).
- Validate input: `name` (min 2 chars), valid email regex, `password` (min 6 chars).
- Check existing user by email; if exists, throw `Error('Email sudah terdaftar')`.
- Hash password using `hashPassword(password)`.
- Create user with `role: Role.RELAWAN` and `isActive: true`.
- Record audit log:
  ```typescript
  await auditService.record({
    userId: user.id,
    action: 'USER_REGISTER',
    entity: 'User',
    entityId: user.id,
    details: { email: user.email, role: 'RELAWAN' },
  });
  ```
- Return safe user representation (excluding `passwordHash`).

#### 2. `requestPasswordReset(email: string, origin?: string)`
- Normalize email.
- Look up active user: `prisma.user.findFirst({ where: { email, isActive: true } })`.
- If user not found: Return `{ success: true, message: 'Jika email terdaftar, tautan pengaturan ulang kata sandi telah dikirim.' }` (prevent account enumeration).
- If user found:
  - Invalidate any previous unused tokens:
    ```typescript
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() }
    });
    ```
  - Generate cryptographically secure token: `crypto.randomBytes(32).toString('hex')`.
  - Expiry: `new Date(Date.now() + 60 * 60 * 1000)` (1 hour).
  - Store token in `prisma.passwordResetToken.create(...)`.
  - Construct reset URL: `${origin || 'http://localhost:3000'}/reset-password?token=${token}`.
  - Dispatch notification:
    - If `SMTP_HOST` is set, attempt sending email via Nodemailer.
    - If not set or during local development (`process.env.NODE_ENV !== 'production'`), log the link to console and return `devResetUrl` in response for immediate developer testing.
  - Record audit log: `PASSWORD_RESET_REQUEST`.

#### 3. `verifyResetToken(token: string)`
- Query `prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } })`.
- Check validity:
  - Must exist.
  - `usedAt` must be null.
  - `expiresAt` must be in the future (`> new Date()`).
  - `user.isActive` must be true.
- If invalid, throw `Error('Tautan pengaturan ulang kata sandi tidak valid atau telah kedaluwarsa')`.
- Return user context.

#### 4. `resetPasswordWithToken(token: string, newPassword: string)`
- Validate `newPassword` (min 6 chars).
- Call `verifyResetToken(token)`.
- Hash new password.
- In a Prisma transaction:
  - Update user's `passwordHash`.
  - Mark `PasswordResetToken` with `usedAt: new Date()`.
- Record audit log: `PASSWORD_RESET_COMPLETED`.
- Return `{ success: true }`.

---

### 4.3 API Route Handlers

1. **`POST /api/auth/register`**
   - Body: `{ name, email, password }`
   - Calls `authService.registerVolunteer(...)`.
   - Returns status 201 with `{ success: true, user }`.
   - Error: status 400 with `{ error: message }`.

2. **`POST /api/auth/forgot-password`**
   - Body: `{ email }`
   - Calls `authService.requestPasswordReset(email, origin)`.
   - Returns status 200 with `{ success: true, message, devResetUrl? }`.

3. **`GET /api/auth/reset-password?token=...`**
   - Query param: `token`
   - Calls `authService.verifyResetToken(token)`.
   - Returns `{ valid: true, email: user.email }` or 400 `{ error }`.

4. **`POST /api/auth/reset-password`**
   - Body: `{ token, password }`
   - Calls `authService.resetPasswordWithToken(token, password)`.
   - Returns status 200 with `{ success: true, message: 'Kata sandi berhasil diperbarui' }`.

---

### 4.4 User Interface Specifications

1. **`src/app/(auth)/login/page.tsx` Updates**:
   - Above or beside the password input, add a sleek link: `Lupa kata sandi?` pointing to `/forgot-password`.
   - Under the submit button / fast demo buttons, add:
     `Belum memiliki akun? Daftar sebagai Relawan` linking to `/register`.

2. **`src/app/(auth)/register/page.tsx`**:
   - Theme: Floating Island container on `#EBF7F3` with `#2B6153` branding.
   - Title: "Pendaftaran Relawan Baru".
   - Subtitle: "Bergabung bersama SisaBerkah untuk menyelamatkan pangan dan berbagi berkah."
   - Inputs:
     - Nama Lengkap (text)
     - Alamat Email (email)
     - Kata Sandi (password with show/hide toggle)
     - Konfirmasi Kata Sandi (password with show/hide toggle)
   - Badge info: `Peran: Relawan Lapangan (Akses Terbuka)`.
   - Submit: "Daftar Akun Relawan".
   - Link: "Sudah memiliki akun? Masuk ke Sistem".
   - Client-side validation: Matching passwords, minimum 6 characters.

3. **`src/app/(auth)/forgot-password/page.tsx`**:
   - Title: "Lupa Kata Sandi".
   - Subtitle: "Masukkan email Anda untuk menerima instruksi pemulihan kata sandi."
   - Inputs: Email.
   - On submit success:
     - Clear message: "Tautan reset kata sandi telah dibuat."
     - If `devResetUrl` is present in response (local dev mode): Display an alert card with a direct button "🧪 Klik di Sini untuk Mengatur Ulang (Mode Dev)".
     - Link back to `/login`.

4. **`src/app/(auth)/reset-password/page.tsx`**:
   - Reads `token` from URL query parameter `?token=XYZ`.
   - Validates token on load:
     - If loading: Show loading skeleton.
     - If invalid/expired: Show error card with button "Minta Tautan Baru" linking to `/forgot-password`.
     - If valid: Render form for "Kata Sandi Baru" and "Konfirmasi Kata Sandi Baru".
   - On submit success:
     - Display success state: "Kata sandi berhasil diatur ulang! Silakan masuk dengan kata sandi baru Anda."
     - Direct button to `/login`.

---

## 5. Verification & Testing Plan

1. **Unit & Service Tests (`tests/auth-registration-reset.test.ts`)**:
   - `registerVolunteer`: Successfully registers volunteer with `role = RELAWAN`.
   - `registerVolunteer`: Blocks duplicate email registrations.
   - `registerVolunteer`: Rejects weak passwords (< 6 chars).
   - `requestPasswordReset`: Unknown email returns success without leaking presence.
   - `requestPasswordReset`: Known email creates valid `PasswordResetToken` in DB.
   - `verifyResetToken`: Accepts valid unexpired token, rejects expired token, rejects already used token.
   - `resetPasswordWithToken`: Updates user `passwordHash`, marks token as used, and validates that user can log in with new password.

2. **API Route Tests**:
   - `POST /api/auth/register` returns 201 on success and 400 on duplicate email.
   - `POST /api/auth/forgot-password` returns 200.
   - `POST /api/auth/reset-password` returns 200 on valid token, 400 on invalid token.

3. **E2E & UI Smoke Tests**:
   - Verify all route pages `/login`, `/register`, `/forgot-password`, `/reset-password` render without runtime errors.

