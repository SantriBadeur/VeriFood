import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Task 3: Profile Dropdown & Change Password', () => {
  it('verifies changePassword function exists in authService', async () => {
    const filePath = path.join(process.cwd(), 'src/services/auth.service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('changePassword');
  });

  it('verifies POST /api/auth/change-password route exists', async () => {
    const filePath = path.join(process.cwd(), 'src/app/api/auth/change-password/route.ts');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('POST');
    expect(content).toContain('changePassword');
  });

  it('verifies ChangePasswordModal component exists and has validations', async () => {
    const filePath = path.join(process.cwd(), 'src/components/ChangePasswordModal.tsx');
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('currentPassword');
    expect(content).toContain('newPassword');
    expect(content).toContain('/api/auth/change-password');
  });

  it('verifies TopHeader has interactive profile dropdown with logout and change password', async () => {
    const filePath = path.join(process.cwd(), 'src/components/layout/top-header.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('isProfileOpen');
    expect(content).toContain('setIsProfileOpen');
    expect(content).toContain('ChangePasswordModal');
    expect(content).toContain('Ganti Kata Sandi');
    expect(content).toContain('Keluar');
  });
});
