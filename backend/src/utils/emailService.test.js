import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const createTransport = vi.fn();
const createTestAccount = vi.fn();
const getTestMessageUrl = vi.fn();
const sendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport,
    createTestAccount,
    getTestMessageUrl,
  },
}));

const importFreshEmailService = async () => {
  vi.resetModules();
  return import('./emailService.js');
};

describe('EmailService', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;
    delete process.env.MAIL_TO_ADMIN;

    vi.clearAllMocks();
    sendMail.mockResolvedValue({ messageId: 'message-1' });
    createTransport.mockReturnValue({ sendMail });
    getTestMessageUrl.mockReturnValue('https://ethereal.email/message/message-1');
    createTestAccount.mockResolvedValue({
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
      user: 'test-user',
      pass: 'test-pass',
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('initializes SMTP transport when SMTP_HOST is configured', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_SECURE = 'true';
    process.env.SMTP_USER = 'mailer';
    process.env.SMTP_PASS = 'secret';

    const { default: emailService } = await importFreshEmailService();
    await Promise.resolve();

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'mailer', pass: 'secret' },
    });
    expect(emailService.initialized).toBe(true);
  });

  it('falls back to Ethereal test account when SMTP_HOST is absent', async () => {
    const { default: emailService } = await importFreshEmailService();
    await Promise.resolve();

    expect(createTestAccount).toHaveBeenCalled();
    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: 'test-user', pass: 'test-pass' },
    });
    expect(emailService.initialized).toBe(true);
  });

  it('parses admin recipients from MAIL_TO_ADMIN', async () => {
    process.env.MAIL_TO_ADMIN = 'admin@example.com, ops@example.com, ,';
    const { default: emailService } = await importFreshEmailService();

    expect(emailService.getAdminRecipients()).toEqual(['admin@example.com', 'ops@example.com']);
  });

  it('uses default sender when MAIL_FROM is missing', async () => {
    const { default: emailService } = await importFreshEmailService();

    expect(emailService.getMailFrom()).toBe('"Inventory ATK" <inventory@company.com>');
  });

  it('sendMail logs only when transporter is unavailable', async () => {
    const { default: emailService } = await importFreshEmailService();
    emailService.initialized = false;
    emailService.transporter = null;

    const result = await emailService.sendMail({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    });

    expect(result).toEqual({ logged: true });
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sendMail sends through configured transporter and returns preview URL', async () => {
    process.env.MAIL_FROM = '"ATK" <atk@example.com>';
    const { default: emailService } = await importFreshEmailService();
    await Promise.resolve();

    const result = await emailService.sendMail({
      to: ['a@example.com', 'b@example.com'],
      subject: 'Hello',
      html: '<strong>Body</strong>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: '"ATK" <atk@example.com>',
      to: 'a@example.com, b@example.com',
      subject: 'Hello',
      html: '<strong>Body</strong>',
    });
    expect(result).toEqual({ messageId: 'message-1', previewUrl: 'https://ethereal.email/message/message-1' });
  });

  it('sendMail returns an error object when sending fails', async () => {
    const { default: emailService } = await importFreshEmailService();
    await Promise.resolve();
    sendMail.mockRejectedValueOnce(new Error('SMTP down'));

    const result = await emailService.sendMail({ to: 'a@example.com', subject: 'Oops', html: '<p>x</p>' });

    expect(result).toEqual({ error: 'SMTP down' });
  });

  it('notifyLowStock skips when there are no admin recipients', async () => {
    process.env.MAIL_TO_ADMIN = ', ,';
    const { default: emailService } = await importFreshEmailService();
    const spy = vi.spyOn(emailService, 'sendMail');

    const result = await emailService.notifyLowStock({
      itemName: 'Pulpen',
      currentStock: 2,
      minStock: 5,
      unit: 'pcs',
    });

    expect(result).toEqual({ skipped: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it('notifyLowStock sends low-stock email to admins', async () => {
    process.env.MAIL_TO_ADMIN = 'admin@example.com';
    const { default: emailService } = await importFreshEmailService();
    const spy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({ ok: true });

    await emailService.notifyLowStock({ itemName: 'Pulpen', currentStock: 2, minStock: 5, unit: 'pcs' });

    expect(spy).toHaveBeenCalledWith({
      to: ['admin@example.com'],
      subject: '⚠️ Stok Menipis: Pulpen',
      html: expect.stringContaining('Pulpen'),
    });
  });

  it('notifyNewRequest sends request email to admins', async () => {
    process.env.MAIL_TO_ADMIN = 'admin@example.com';
    const { default: emailService } = await importFreshEmailService();
    const spy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({ ok: true });

    await emailService.notifyNewRequest({
      requester: 'Budi',
      dept: 'IT',
      itemName: 'Kertas',
      qty: 3,
      unit: 'rim',
    });

    expect(spy).toHaveBeenCalledWith({
      to: ['admin@example.com'],
      subject: '📋 Request Baru: Kertas dari IT',
      html: expect.stringContaining('Budi'),
    });
  });

  it('notifyUserRequestStatus skips when recipient is empty', async () => {
    const { default: emailService } = await importFreshEmailService();

    await expect(
      emailService.notifyUserRequestStatus({ to: '', itemName: 'Pulpen', status: 'APPROVED', message: 'OK' })
    ).resolves.toEqual({ skipped: true });
  });

  it('notifyUserRequestStatus chooses status-specific subjects', async () => {
    const { default: emailService } = await importFreshEmailService();
    const spy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({ ok: true });

    await emailService.notifyUserRequestStatus({
      to: 'user@example.com',
      itemName: 'Pulpen',
      status: 'REJECTED',
      message: 'Ditolak',
    });

    expect(spy).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Permintaan ditolak: Pulpen',
      html: expect.stringContaining('Ditolak'),
    });
  });

  it('notifyOpnameFinalized sends summary email to admins', async () => {
    process.env.MAIL_TO_ADMIN = 'admin@example.com';
    const { default: emailService } = await importFreshEmailService();
    const spy = vi.spyOn(emailService, 'sendMail').mockResolvedValue({ ok: true });

    await emailService.notifyOpnameFinalized({ sessionId: 7, adjustedCount: 4, performedBy: 'Admin' });

    expect(spy).toHaveBeenCalledWith({
      to: ['admin@example.com'],
      subject: '✅ Stock Opname #7 Selesai',
      html: expect.stringContaining('Admin'),
    });
  });
});
