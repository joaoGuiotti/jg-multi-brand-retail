import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';

export interface PasswordResetMailPayload {
  to: string;
  userName: string;
  tenantName: string;
  tenantLogoUrl?: string | null;
  resetUrl: string;
  expiryMinutes: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('auth.forgot-password')
  async onForgotPassword(payload: PasswordResetMailPayload): Promise<void> {
    await this.sendPasswordReset(payload);
  }

  async sendPasswordReset(payload: PasswordResetMailPayload): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: payload.to,
        subject: `Redefinição de senha — ${payload.tenantName}`,
        template: 'reset-password',
        context: {
          userName: payload.userName,
          tenantName: payload.tenantName,
          tenantLogoUrl: payload.tenantLogoUrl ?? null,
          resetUrl: payload.resetUrl,
          expiryMinutes: payload.expiryMinutes,
        },
      });
      this.logger.log(`Password reset email sent to ${payload.to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${payload.to}`,
        error,
      );
    }
  }
}
