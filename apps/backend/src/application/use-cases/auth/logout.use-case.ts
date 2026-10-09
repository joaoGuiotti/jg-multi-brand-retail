import * as crypto from 'crypto';
import { UseCase } from '@common/application/use-case.interface';
import { Injectable, Optional } from '@nestjs/common';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token-repository';

export type LogoutInput = {
  refreshToken?: string;
};

export type LogoutOutput = {
  message: string;
};

@Injectable()
export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {
  constructor(
    @Optional() private refreshTokenRepository?: RefreshTokenRepository,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (this.refreshTokenRepository && input.refreshToken) {
      try {
        const tokenHash = crypto
          .createHash('sha256')
          .update(input.refreshToken)
          .digest('hex');

        const tokenRecord =
          await this.refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenRecord) {
          await this.refreshTokenRepository.revokeFamily(tokenRecord.familyId);
        }
      } catch {
        // Defensive: falha silenciosa para não impedir o logout do cliente
      }
    }

    return { message: 'Logged out successfully' };
  }
}
