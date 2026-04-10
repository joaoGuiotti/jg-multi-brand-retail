import { UseCase } from '@common/application/use-case.interface';
import { PasswordResetTokenRepository } from '@domain/repositories/password-reset-token-repository';
import { UserRepository } from '@domain/repositories/user-repository';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export type ResetPasswordInput = {
  token: string;
  email: string;
  newPassword: string;
};

export type ResetPasswordOutput = {
  message: string;
};

const INVALID_TOKEN_MSG = 'This reset link is invalid or has expired.';

@Injectable()
export class ResetPasswordUseCase implements UseCase<
  ResetPasswordInput,
  ResetPasswordOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    // Find the user
    const result = await this.userRepository.findByEmail(input.email);
    if (!result) {
      throw new BadRequestException(INVALID_TOKEN_MSG);
    }

    const { user, tenantId } = result;

    // Find the latest token for this user
    const storedToken = await this.tokenRepository.findLatestByUserId(
      user.id.toString(),
    );
    if (!storedToken) {
      throw new BadRequestException(INVALID_TOKEN_MSG);
    }

    // Validate token state (not expired, not used)
    if (!storedToken.isValid()) {
      throw new BadRequestException(INVALID_TOKEN_MSG);
    }

    // Verify the plain token against the stored bcrypt hash
    const isMatch = await bcrypt.compare(input.token, storedToken.tokenHash);
    if (!isMatch) {
      throw new BadRequestException(INVALID_TOKEN_MSG);
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

    // Update password + increment tokenVersion (revokes all active sessions)
    user.updatePassword(newPasswordHash);
    await this.userRepository.update(tenantId, user);

    // Mark token as used (single-use enforcement)
    await this.tokenRepository.markAsUsed(storedToken.id.toString());

    return {
      message:
        'Password reset successfully. Please log in with your new password.',
    };
  }
}
