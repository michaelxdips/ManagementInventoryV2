import nodemailer from 'nodemailer';

/**
 * Email: set SMTP_* + MAIL_FROM + MAIL_TO_ADMIN for production.
 * Tanpa SMTP_HOST: fallback Ethereal (dev).
 * MAIL_TO_ADMIN: comma-separated addresses (default admin@company.com).
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
        this.init();
    }

    getMailFrom() {
        return process.env.MAIL_FROM || '"Inventory ATK" <inventory@company.com>';
    }

    getAdminRecipients() {
        const raw = process.env.MAIL_TO_ADMIN || 'admin@company.com';
        return raw
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
    }

    async init() {
        const host = process.env.SMTP_HOST;
        if (host) {
            try {
                const port = parseInt(process.env.SMTP_PORT || '587', 10);
                const secure = process.env.SMTP_SECURE === 'true';
                const user = process.env.SMTP_USER;
                const pass = process.env.SMTP_PASS;
                this.transporter = nodemailer.createTransport({
                    host,
                    port,
                    secure,
                    auth: user ? { user, pass: pass || '' } : undefined,
                });
                this.initialized = true;
                console.log(`📧 Email service: SMTP (${host}:${port})`);
            } catch (err) {
                console.warn('⚠️ SMTP transporter failed:', err.message);
            }
            return;
        }

        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: testAccount.smtp.host,
                port: testAccount.smtp.port,
                secure: testAccount.smtp.secure,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.initialized = true;
            console.log('📧 Email service initialized (Ethereal test mode)');
            console.log('   Preview URL base: https://ethereal.email');
            console.log(`   Test account: ${testAccount.user}`);
        } catch (err) {
            console.warn('⚠️ Email service failed to initialize:', err.message);
            console.warn('   Email notifications will be logged to console instead.');
        }
    }

    async sendMail({ to, subject, html }) {
        const toList = Array.isArray(to) ? to : String(to).split(',').map((s) => s.trim()).filter(Boolean);
        console.log(`\n📧 EMAIL NOTIFICATION:`);
        console.log(`   To: ${toList.join(', ')}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body: ${html.replace(/<[^>]*>/g, '').substring(0, 200)}...`);

        if (!this.initialized || !this.transporter) {
            console.log('   [Logged only - transporter not available]');
            return { logged: true };
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.getMailFrom(),
                to: toList.join(', '),
                subject,
                html,
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`   ✅ Preview: ${previewUrl}`);
            }
            return { messageId: info.messageId, previewUrl };
        } catch (err) {
            console.error('   ❌ Failed to send:', err.message);
            return { error: err.message };
        }
    }

    async notifyLowStock({ itemName, currentStock, minStock, unit }) {
        const to = this.getAdminRecipients();
        if (to.length === 0) {
            console.warn('MAIL_TO_ADMIN kosong — email stok tidak dikirim.');
            return { skipped: true };
        }
        return this.sendMail({
            to,
            subject: `⚠️ Stok Menipis: ${itemName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #d73a49; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0;">⚠️ Peringatan Stok Menipis</h2>
                    </div>
                    <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                        <p>Barang berikut telah mencapai batas minimum stok:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr><td style="padding: 8px; font-weight: bold;">Nama Barang</td><td style="padding: 8px;">${itemName}</td></tr>
                            <tr style="background: #f8f8f8;"><td style="padding: 8px; font-weight: bold;">Stok Saat Ini</td><td style="padding: 8px; color: #d73a49; font-weight: bold;">${currentStock} ${unit}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Batas Minimum</td><td style="padding: 8px;">${minStock} ${unit}</td></tr>
                        </table>
                        <p style="color: #666;">Segera lakukan restock untuk menghindari kekosongan barang.</p>
                        <p style="font-size: 12px; color: #999; margin-top: 24px;">Email otomatis dari Inventory Management System</p>
                    </div>
                </div>
            `,
        });
    }

    async notifyNewRequest({ requester, dept, itemName, qty, unit }) {
        const to = this.getAdminRecipients();
        if (to.length === 0) {
            console.warn('MAIL_TO_ADMIN kosong — email request baru tidak dikirim.');
            return { skipped: true };
        }
        return this.sendMail({
            to,
            subject: `📋 Request Baru: ${itemName} dari ${dept}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2f81f7; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0;">📋 Permintaan Barang Baru</h2>
                    </div>
                    <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                        <p>Permintaan baru telah diajukan dan membutuhkan persetujuan Anda:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr><td style="padding: 8px; font-weight: bold;">Pemohon</td><td style="padding: 8px;">${requester}</td></tr>
                            <tr style="background: #f8f8f8;"><td style="padding: 8px; font-weight: bold;">Unit/Dept</td><td style="padding: 8px;">${dept}</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Barang</td><td style="padding: 8px;">${itemName}</td></tr>
                            <tr style="background: #f8f8f8;"><td style="padding: 8px; font-weight: bold;">Jumlah</td><td style="padding: 8px;">${qty} ${unit}</td></tr>
                        </table>
                        <p style="color: #666;">Silakan buka Dashboard untuk melakukan review dan approval.</p>
                        <p style="font-size: 12px; color: #999; margin-top: 24px;">Email otomatis dari Inventory Management System</p>
                    </div>
                </div>
            `,
        });
    }

    async notifyUserRequestStatus({ to, itemName, status, message }) {
        const toAddr = String(to || '').trim();
        if (!toAddr) {
            return { skipped: true };
        }
        const st = String(status || '').toUpperCase();
        const subject =
            st === 'APPROVED'
                ? `Permintaan disetujui: ${itemName}`
                : st === 'REJECTED'
                  ? `Permintaan ditolak: ${itemName}`
                  : `Update permintaan: ${itemName}`;
        return this.sendMail({
            to: toAddr,
            subject,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2f81f7; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0;">Status permintaan — ${st}</h2>
                    </div>
                    <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                        <p><strong>Barang:</strong> ${itemName}</p>
                        <p style="margin-top: 12px;">${message}</p>
                        <p style="font-size: 12px; color: #999; margin-top: 24px;">Email otomatis dari Inventory Management System</p>
                    </div>
                </div>
            `,
        });
    }

    async notifyOpnameFinalized({ sessionId, adjustedCount, performedBy }) {
        const to = this.getAdminRecipients();
        if (to.length === 0) {
            console.warn('MAIL_TO_ADMIN kosong — email opname tidak dikirim.');
            return { skipped: true };
        }
        return this.sendMail({
            to,
            subject: `✅ Stock Opname #${sessionId} Selesai`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #28a745; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
                        <h2 style="margin: 0;">✅ Stock Opname Difinalisasi</h2>
                    </div>
                    <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                        <p>Sesi Stock Opname telah selesai difinalisasi:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                            <tr><td style="padding: 8px; font-weight: bold;">Sesi ID</td><td style="padding: 8px;">#${sessionId}</td></tr>
                            <tr style="background: #f8f8f8;"><td style="padding: 8px; font-weight: bold;">Barang Disesuaikan</td><td style="padding: 8px;">${adjustedCount} item</td></tr>
                            <tr><td style="padding: 8px; font-weight: bold;">Dilakukan oleh</td><td style="padding: 8px;">${performedBy}</td></tr>
                        </table>
                        <p style="color: #666;">Stok utama telah diperbarui sesuai hasil penghitungan fisik.</p>
                        <p style="font-size: 12px; color: #999; margin-top: 24px;">Email otomatis dari Inventory Management System</p>
                    </div>
                </div>
            `,
        });
    }
}

const emailService = new EmailService();
export default emailService;
