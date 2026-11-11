# SisaBerkah - Volunteer Registration & Password Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement self-service volunteer registration and token-based password reset for SisaBerkah with dual-mode notification (SMTP with local dev preview fallback).

**Architecture:** Prisma SQLite schema extension with `PasswordResetToken`, business methods added to `auth.service.ts` for safe registration and 1-hour cryptographically secure reset tokens, dedicated Next.js App Router API route handlers, and floating island auth UI pages.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma ORM (SQLite), Tailwind CSS, Lucide React, Vitest, bcryptjs, Node.js crypto.

**Spec:** [docs/superpowers/specs/2026-11-10-auth-registration-reset-password-design.md](file:///d:/Sisa%20berkah/docs/superpowers/specs/2026-11-10-auth-registration-reset-password-design.md)

---

## Global Constraints

- Platform: Windows (Node.js v26.3.0, npm.cmd v11.16.0).
- Database: Embedded SQLite (`prisma/dev.db`) using Prisma ORM.
- RBAC Safety: Public registration must unconditionally force `role = 'RELAWAN'`.
- Password Security: Hashed with bcrypt (10 rounds), minimum length 6 characters.
- Reset Token Security: 256-bit random hex (`crypto.randomBytes(32)`), valid for 60 minutes, invalidated upon first use (`usedAt != null`).
- Enumeration Protection: Forgot password endpoint must return identical success messaging regardless of whether the email exists.
- Hybrid Notification: If SMTP environment variables are absent, reset links are output to server console and returned in development mode payloads for instant testing.

---

## Review Focus

1. **Privilege Escalation Attempt**: Attempting to pass `role: 'ADMIN'` to `/api/auth/register` must be ignored, ensuring the created user is strictly `RELAWAN`.
2. **Account Enumeration Resistance**: Submitting an unregistered or inactive email to `/api/auth/forgot-password` must return HTTP 200 with generic success response.
3. **Replay / Double Use of Token**: Submitting `/api/auth/reset-password` with a token that has already been used (`usedAt != null`) must be rejected with HTTP 400.
4. **Expired Token Invalidation**: Submitting `/api/auth/reset-password` with a token past its `expiresAt` must be rejected with HTTP 400.
5. **Missing/Malformed Query Parameter on Reset Page**: Navigating to `/reset-password` without a valid `token` query param must render an informative error state and link back to `/forgot-password`.

---

## File Structure & Module Map

```
prisma/
  schema.prisma                                    # Add PasswordResetToken model & User relation
src/
  services/
    auth.service.ts                                # Add registerVolunteer, requestPasswordReset, verifyResetToken, resetPasswordWithToken
  app/
    api/auth/
      register/route.ts                            # POST /api/auth/register
      forgot-password/route.ts                     # POST /api/auth/forgot-password
      reset-password/route.ts                      # GET & POST /api/auth/reset-password
    (auth)/
      login/page.tsx                               # Add forgot-password & register links
      register/page.tsx                            # Volunteer registration form view
      forgot-password/page.tsx                     # Password recovery request view
      reset-password/page.tsx                      # Token-validated new password form view
tests/
  auth-registration-reset.test.ts                  # Service-level unit and integration tests
  e2e-api-registration-reset.test.ts              # API Route Handler tests
  e2e-smoke.test.ts                                # Smoke test updating routes verification
```

---

## Task Decomposition

### Task 1: Prisma Schema Update & Database Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Test: `tests/setup.test.ts`

**Interfaces:**
- Produces: `PasswordResetToken` Prisma model accessible via `prisma.passwordResetToken`.

- [ ] **Step 1: Write test verifying `prisma.passwordResetToken` query capability**

Add to `tests/setup.test.ts`:
```typescript
it('should have PasswordResetToken model available in Prisma client', async () => {
  const count = await prisma.passwordResetToken.count();
  expect(count).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/setup.test.ts`  
Expected: FAIL (`passwordResetToken` is undefined on `prisma`).

- [ ] **Step 3: Update `prisma/schema.prisma` with `PasswordResetToken` model and push schema**

Add `PasswordResetToken` model with fields `id`, `token` (@unique), `userId`, `user`, `expiresAt`, `usedAt`, `createdAt`, and add relation `passwordResetTokens PasswordResetToken[]` to `User`.  
Run command: `cmd /c npx prisma db push`

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npx vitest run tests/setup.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add prisma/schema.prisma tests/setup.test.ts
git commit -m "feat(db): add PasswordResetToken model to schema"
```

---

### Task 2: Service Layer Methods for Registration & Password Reset

**Files:**
- Modify: `src/services/auth.service.ts`
- Create: `tests/auth-registration-reset.test.ts`

**Interfaces:**
- Consumes: `prisma`, `hashPassword`, `verifyPassword` from `src/lib/auth.ts`, `auditService` from `src/services/audit.service.ts`.
- Produces:
  - `authService.registerVolunteer(input: { name: string; email: string; password: string }): Promise<SafeUser>`
  - `authService.requestPasswordReset(email: string, origin?: string): Promise<{ success: boolean; message: string; devResetUrl?: string }>`
  - `authService.verifyResetToken(token: string): Promise<{ valid: boolean; email: string; userId: string }>`
  - `authService.resetPasswordWithToken(token: string, newPassword: string): Promise<{ success: boolean }>`

- [ ] **Step 1: Write unit tests for all 4 auth service methods**

Create `tests/auth-registration-reset.test.ts` testing:
1. `registerVolunteer`: registers user with role `RELAWAN` and active status.
2. `registerVolunteer`: rejects duplicate email with "Email sudah terdaftar".
3. `registerVolunteer`: rejects passwords shorter than 6 characters.
4. `requestPasswordReset`: non-existent email returns success without creating a token.
5. `requestPasswordReset`: valid email creates token in `PasswordResetToken` with 1-hour expiry.
6. `verifyResetToken`: returns valid for fresh token, throws for expired or used token.
7. `resetPasswordWithToken`: updates password hash, marks token `usedAt`, and allows subsequent login with new password.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/auth-registration-reset.test.ts`  
Expected: FAIL with missing methods on `authService`.

- [ ] **Step 3: Implement registration and password reset methods in `src/services/auth.service.ts`**

Implement `registerVolunteer`, `requestPasswordReset`, `verifyResetToken`, and `resetPasswordWithToken` adhering to the cryptographic guidelines and audit logging requirements in the design doc.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npx vitest run tests/auth-registration-reset.test.ts`  
Expected: All 7 tests PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/services/auth.service.ts tests/auth-registration-reset.test.ts
git commit -m "feat(auth): add volunteer registration and password reset service methods"
```

---

### Task 3: API Route Handlers

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`
- Create: `tests/e2e-api-registration-reset.test.ts`

**Interfaces:**
- Consumes: `authService` from `src/services/auth.service.ts`.
- Produces: HTTP endpoints:
  - `POST /api/auth/register` (returns 201)
  - `POST /api/auth/forgot-password` (returns 200)
  - `GET /api/auth/reset-password?token=XYZ` (returns 200 or 400)
  - `POST /api/auth/reset-password` (returns 200 or 400)

- [ ] **Step 1: Write integration tests for the API routes**

Create `tests/e2e-api-registration-reset.test.ts`:
1. `POST /api/auth/register`: 201 on valid input, 400 on duplicate or weak password.
2. `POST /api/auth/forgot-password`: 200 and returns `devResetUrl` when in development mode.
3. `GET /api/auth/reset-password`: 200 on valid token, 400 on invalid/expired token.
4. `POST /api/auth/reset-password`: 200 on valid token update, 400 on invalid token.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/e2e-api-registration-reset.test.ts`  
Expected: FAIL with 404 Route Not Found.

- [ ] **Step 3: Implement route handlers**

Create `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, and `src/app/api/auth/reset-password/route.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cmd /c npx vitest run tests/e2e-api-registration-reset.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add src/app/api/auth/register/route.ts src/app/api/auth/forgot-password/route.ts src/app/api/auth/reset-password/route.ts tests/e2e-api-registration-reset.test.ts
git commit -m "feat(api): add registration and password reset route handlers"
```

---

### Task 4: UI Updates & Dedicated Authentication Views

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/forgot-password/page.tsx`
- Create: `src/app/(auth)/reset-password/page.tsx`
- Modify: `tests/e2e-smoke.test.ts`

**Interfaces:**
- Consumes: Next.js Link, React state, Lucide React icons, API endpoints created in Task 3.
- Produces: Interactive web views matching the SisaBerkah design system.

- [ ] **Step 1: Update UI smoke test to check all 4 auth pages**

In `tests/e2e-smoke.test.ts`, import `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage` and verify they render defined components.

- [ ] **Step 2: Run test to verify it fails**

Run: `cmd /c npx vitest run tests/e2e-smoke.test.ts`  
Expected: FAIL due to missing page modules.

- [ ] **Step 3: Update `src/app/(auth)/login/page.tsx` with links to forgot-password and register**

Add "Lupa kata sandi?" link above/beside password input, and "Belum memiliki akun? Daftar sebagai Relawan" link below the fast demo block.

- [ ] **Step 4: Create `src/app/(auth)/register/page.tsx`**

Build responsive form: Name, Email, Password, Password Confirmation with eye toggle, role badge ("Relawan Lapangan"), error handling, and redirection to `/login` upon success.

- [ ] **Step 5: Create `src/app/(auth)/forgot-password/page.tsx`**

Build email submission form. When response includes `devResetUrl`, show an alert box with direct click-through button for easy testing in development.

- [ ] **Step 6: Create `src/app/(auth)/reset-password/page.tsx`**

Extract `token` from `useSearchParams()`. Validate token on mount via `GET /api/auth/reset-password?token=...`. Provide new password & confirm inputs, submit to `POST /api/auth/reset-password`, and show success redirect.

- [ ] **Step 7: Run smoke test to verify it passes**

Run: `cmd /c npx vitest run tests/e2e-smoke.test.ts`  
Expected: PASS.

- [ ] **Step 8: Commit changes**

```bash
git add src/app/\(auth\)/ tests/e2e-smoke.test.ts
git commit -m "feat(ui): add register, forgot-password, reset-password pages and update login"
```

---

### Task 5: Full Regression Testing & Verification

**Files:**
- Run all test suites across the repository.

- [ ] **Step 1: Run complete test suite**

Run: `cmd /c npm test`  
Expected: All test suites (existing 72 tests + all new tests) PASS.

- [ ] **Step 2: Final git status check and verification**

Ensure no leftover temporary files or uncommitted changes.

