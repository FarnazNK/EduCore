// server/src/services/email.service.ts

import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: config.email.user && config.email.password ? {
        user: config.email.user,
        pass: config.email.password,
      } : undefined,
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: config.email.from,
        to,
        subject,
        html,
      });

      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Email send error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string) {
    const subject = 'Welcome to EduCore!';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EduCore! 🎓</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thank you for joining EduCore! We're excited to have you on board.</p>
              <p>You now have access to thousands of courses taught by expert instructors. Start your learning journey today!</p>
              <a href="${config.cors.origin[0]}/courses" class="button">Browse Courses</a>
              <p>If you have any questions, feel free to reach out to our support team.</p>
              <p>Happy Learning!<br>The EduCore Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduCore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${config.cors.origin[0]}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your Password';
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>We received a request to reset your password.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <div class="warning">
                <strong>Note:</strong> This link will expire in 1 hour.
              </div>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduCore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(email, subject, html);
  }

  async sendCourseEnrollmentEmail(email: string, firstName: string, courseName: string) {
    const subject = `You're enrolled in ${courseName}!`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Course Enrollment Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Great news! You've successfully enrolled in <strong>${courseName}</strong>.</p>
              <p>You can now access all course materials and start learning at your own pace.</p>
              <a href="${config.cors.origin[0]}/dashboard/courses" class="button">Start Learning</a>
              <p>Good luck with your learning journey!</p>
              <p>Best regards,<br>The EduCore Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduCore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(email, subject, html);
  }

  async sendCertificateEmail(email: string, firstName: string, courseName: string, certificateUrl: string) {
    const subject = `Congratulations! You've completed ${courseName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Congratulations! 🏆</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Fantastic work! You've successfully completed <strong>${courseName}</strong>.</p>
              <p>Your certificate of completion is now ready. Download it and share your achievement with the world!</p>
              <a href="${certificateUrl}" class="button">Download Certificate</a>
              <p>Keep up the great work and continue learning!</p>
              <p>Best regards,<br>The EduCore Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EduCore. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.send(email, subject, html);
  }
}

export const emailService = new EmailService();
