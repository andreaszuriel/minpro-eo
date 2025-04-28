import nodemailer from 'nodemailer';

export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  public async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetLink = `${process.env.CLIENT_RESET_URL}?token=${token}`;

    await this.transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔒 Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }

  public async sendTransactionAccepted(
    email: string,
    txnId: number,
    ticketUrl: string
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎫 Your Ticket is Confirmed',
      html: `
        <p>Hi there,</p>
        <p>Your transaction <strong>#${txnId}</strong> has been accepted!</p>
        <p>You can download your ticket here: <a href="${ticketUrl}">Download Ticket</a></p>
      `,
    });
  }

  public async sendTransactionRejected(
    email: string,
    txnId: number
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '❌ Your Transaction was Rejected',
      html: `
        <p>Hi there,</p>
        <p>Unfortunately, your transaction <strong>#${txnId}</strong> was rejected.</p>
        <p>Any points or coupons you used have been returned to your account.</p>
      `,
    });
  }
}
