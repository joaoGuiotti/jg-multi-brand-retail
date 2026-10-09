import * as crypto from 'crypto';
import { UseCase } from '@common/application/use-case.interface';
import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

export type LogoutInput = {
  refreshToken?: string;
};

export type LogoutOutput = {
  message: string;
};

@Injectable()
export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {
  constructor(@Optional() private prisma?: PrismaService) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    if (this.prisma && input.refreshToken) {
      try {
        const tokenHash = crypto
          .createHash('sha256')
          .update(input.refreshToken)
          .digest('hex');

        await this.prisma.withAuthLookup(async (tx) => {
          const tokenRecord = await tx.refreshToken.findUnique({
            where: { tokenHash },
          });

          if (tokenRecord) {
            // Revoga a família inteira do refresh token
            await tx.refreshToken.updateMany({
              where: { familyId: tokenRecord.familyId },
              data: { revokedAt: new Date() },
            });
          }
        });
      } catch {
        // Defensive: falha silenciosa para não impedir o logout do cliente
      }
    }

    return { message: 'Logged out successfully' };
  }
}
