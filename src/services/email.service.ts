import nodemailer from 'nodemailer';
import { User, Event, TransactionStatus } from '@prisma/client';

// Check for required environment variables
const requiredEnvVars = [
  "EMAIL_SERVER_USER",
  "EMAIL_SERVER_PASSWORD",
  "EMAIL_SERVER_HOST",
  "EMAIL_SERVER_PORT",
  "EMAIL_FROM"
];

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Validate env vars are present
  for (const name of requiredEnvVars) {
    if (!process.env[name]) {
      console.error(`Missing required environment variable: ${name}`);
      throw new Error(`Email service configuration error: Missing ${name}`);
    }
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: process.env.NODE_ENV === "production",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

export class EmailService {
  static async sendPasswordChangeConfirmation(
    user: { name: string | null; email: string } // <--- Changed type
) {
  try {
    const transporter = createTransporter();

    const subject = `Your Password Has Been Changed - Event Ticketing`;
    const body = `
      <h1>Password Changed Successfully</h1>
      <p>Hello ${user.name || 'there'},</p>
      <p>This email confirms that the password for your Event Ticketing account associated with ${user.email} was recently changed.</p>
      <p>If you did not make this change, please contact our support team immediately.</p>
      <br>
      <p>Thanks,</p>
      <p>The Event Ticketing Team</p>
    `;

    const info = await transporter.sendMail({
      from: `"Event Ticketing" <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject,
      html: body,
    });

    console.log(`Password change confirmation sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Failed to send password change confirmation email:', error);
  }
}

// Make sure sendPasswordResetEmail is correctly implemented if you need it
// (Using the implementation from previous steps)
static async sendPasswordResetEmail(
    user: { name: string | null; email: string }, // Also only needs name/email
    resetUrl: string
) {
  try {
      const transporter = createTransporter();

      const subject = `Reset Your Password - Event Ticketing`;
      const body = `
        <h1>Password Reset Request</h1>
        <p>Hello ${user.name || 'there'},</p>
        <p>You requested a password reset for your Event Ticketing account associated with ${user.email}.</p>
        <p>Click the link below to set a new password. This link will expire in 1 hour.</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <p>Reset Link (if button doesn't work): ${resetUrl}</p>
        <br>
        <p>Thanks,</p>
        <p>The Event Ticketing Team</p>
      `;

      const info = await transporter.sendMail({
        from: `"Event Ticketing" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject,
        html: body,
      });

      console.log(`Password reset email sent to ${user.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
}
  /**
   * Send a transaction status update notification email
   */
  static async sendTransactionStatusUpdate(
    user: User,
    event: Event,
    transactionId: number,
    newStatus: TransactionStatus,
    ticketQuantity: number
  ) {
    try {
      const transporter = createTransporter();
      
      // Email subject based on status
      const subject = newStatus === 'PAID' 
        ? `Your ticket purchase has been approved! - ${event.title}`
        : `Update on your ticket purchase - ${event.title}`;
      
      // Build email body based on status
      let body = '';
      
      if (newStatus === 'PAID') {
        body = `
          <h1>Good news, ${user.name || 'there'}!</h1>
          <p>Your purchase of ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for <strong>${event.title}</strong> has been approved.</p>
          <p>Event details:</p>
          <ul>
            <li><strong>Date:</strong> ${new Date(event.startDate).toLocaleString()}</li>
            <li><strong>Location:</strong> ${event.location}</li>
          </ul>
          <p>Your tickets are now available in your account. <a href="${process.env.NEXTAUTH_URL}/dashboard/tickets">View your tickets here</a>.</p>
          <p>Transaction ID: ${transactionId}</p>
          <p>Thank you for your purchase!</p>
        `;
      } else if (newStatus === 'CANCELED') {
        body = `
          <h1>Important update, ${user.name || 'there'}!</h1>
          <p>Unfortunately, your purchase of ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for <strong>${event.title}</strong> has been canceled.</p>
          <p>If you believe this is an error, please contact us immediately.</p>
          <p>Transaction ID: ${transactionId}</p>
        `;
      } else if (newStatus === 'WAITING_ADMIN') {
        body = `
          <h1>Thank you for your purchase, ${user.name || 'there'}!</h1>
          <p>Your purchase of ${ticketQuantity} ticket${ticketQuantity > 1 ? 's' : ''} for <strong>${event.title}</strong> is being reviewed.</p>
          <p>We'll let you know once your purchase is confirmed.</p>
          <p>Transaction ID: ${transactionId}</p>
        `;
      } else {
        body = `
          <h1>Transaction Update</h1>
          <p>Hello ${user.name || 'there'},</p>
          <p>The status of your transaction for <strong>${event.title}</strong> has been updated to: ${newStatus}.</p>
          <p>Transaction ID: ${transactionId}</p>
          <p>You can check the status of your transaction in your account.</p>
        `;
      }
      
      // Send the email
      const info = await transporter.sendMail({
        from: `"Event Ticketing" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject,
        html: body,
      });
      
      console.log(`Email sent to ${user.email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send transaction status update email:', error);
      // Don't throw error to prevent breaking transaction flow
      // but log it for monitoring
    }
  }
  
  /**
   * Send ticket information for a completed transaction
   */
  static async sendTickets(email: string, tickets: any[], event?: Event) {
    try {
      const transporter = createTransporter();
      
      // Validate email
      if (!email) {
        throw new Error('Missing recipient email address');
      }
      
      // Create ticket list
      const ticketList = tickets.map(ticket => `
        <div style="margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
          <p><strong>Ticket ID:</strong> ${ticket.serialCode}</p>
          <p><strong>Tier:</strong> ${ticket.tierType}</p>
          ${ticket.isUsed ? '<p style="color: red;">This ticket has been used</p>' : '<p style="color: green;">Valid ticket</p>'}
        </div>
      `).join('');
      
      let eventDetails = '';
      if (event) {
        eventDetails = `
          <h2>Event Details</h2>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        `;
      }
      
      const info = await transporter.sendMail({
        from: `"Event Ticketing" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Your Tickets${event ? ` for ${event.title}` : ''}`,
        html: `
          <h1>Your Tickets</h1>
          ${eventDetails}
          <h2>Ticket Information</h2>
          ${ticketList}
          <p>Please keep this email as proof of purchase.</p>
        `,
      });
      
      console.log(`Tickets email sent to ${email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Failed to send tickets email:', error);
      throw error; // Re-throw as this is likely called directly by the user
    }
  }
}