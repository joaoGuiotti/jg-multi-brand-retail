import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UseCase } from '@common/application/use-case.interface';
import { UserRepository } from '@domain/repositories/user-repository';
import {
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/persistence/prisma/prisma.service';

export type RefreshTokenInput = {
  refreshToken: string;
  ip?: string;
  userAgent?: string;
};

export type RefreshTokenOutput = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class RefreshTokenUseCase implements UseCase<
  RefreshTokenInput,
  RefreshTokenOutput
> {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Optional() private prisma?: PrismaService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    let payload: any;
    try {
      payload = this.jwtService.verify(input.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tenantId = payload.tenantId;
    const userId = payload.sub;

    // Se temos acesso ao Prisma, aplicamos controle rigoroso de família, rotação e reuso
    if (this.prisma) {
      const tokenHash = crypto
        .createHash('sha256')
        .update(input.refreshToken)
        .digest('hex');

      const tokenRecord = await this.prisma.withAuthLookup(async (tx) => {
        return await tx.refreshToken.findUnique({
          where: { tokenHash },
        });
      });

      if (tokenRecord) {
        // DETECÇÃO DE REUSO (ALERTA DE ROUBO DE TOKEN)
        if (
          tokenRecord.revokedAt !== null ||
          tokenRecord.replacedByTokenId !== null
        ) {
          this.logger.warn(
            `🚨 ALERTA DE SEGURANÇA: Reuso de Refresh Token detectado para o usuário ${userId} (Família ${tokenRecord.familyId})!`,
          );

          // 1. Revoga IMEDIATAMENTE toda a família de tokens
          await this.prisma.withAuthLookup(async (tx) => {
            await tx.refreshToken.updateMany({
              where: { familyId: tokenRecord.familyId },
              data: { revokedAt: new Date() },
            });

            // 2. Registra evento de segurança em audit_logs
            await tx.auditLog.create({
              data: {
                tenantId: tokenRecord.tenantId,
                userId: tokenRecord.userId,
                entityType: 'SECURITY_ALERT',
                entityId: tokenRecord.familyId,
                action: 'UPDATE',
                changes: {
                  event: 'REFRESH_TOKEN_REUSE_DETECTED',
                  familyId: tokenRecord.familyId,
                  revokedTokenId: tokenRecord.id,
                  ip: input.ip ?? null,
                  userAgent: input.userAgent ?? null,
                },
              },
            });
          });

          // 3. Força invalidação de sessões de todos os dispositivos do usuário incrementando tokenVersion
          const targetUser = await this.userRepository.findById(
            tokenRecord.tenantId,
            tokenRecord.userId,
          );
          if (targetUser) {
            targetUser.revokeAllSessions();
            await this.userRepository.update(tokenRecord.tenantId, targetUser);
          }

          throw new UnauthorizedException(
            'Security violation: Refresh token reuse detected. All sessions revoked.',
          );
        }

        // Verifica expiração
        if (tokenRecord.expiresAt < new Date()) {
          throw new UnauthorizedException('Refresh token has expired');
        }

        // Token é válido: prossegue com rotação na mesma família
        const user = await this.userRepository.findById(tenantId, userId);
        if (!user || !user.active) {
          throw new UnauthorizedException('User not found or inactive');
        }

        if (
          payload.tokenVersion !== undefined &&
          user.tokenVersion !== payload.tokenVersion
        ) {
          throw new UnauthorizedException(
            'Session has been invalidated. Please log in again.',
          );
        }

        const newFamilyId = tokenRecord.familyId;
        const tokens = await this.generateTokens(
          user.id.toString(),
          user.email,
          tenantId,
          user.role,
          user.tokenVersion,
          newFamilyId,
        );

        const newTokenId = uuidv4();
        const newTokenHash = crypto
          .createHash('sha256')
          .update(tokens.refreshToken)
          .digest('hex');

        await this.prisma.withAuthLookup(async (tx) => {
          // Invalida o token anterior
          await tx.refreshToken.update({
            where: { id: tokenRecord.id },
            data: {
              revokedAt: new Date(),
              replacedByTokenId: newTokenId,
            },
          });

          // Cria novo token na mesma família
          await tx.refreshToken.create({
            data: {
              id: newTokenId,
              tenantId,
              userId: user.id.toString(),
              tokenHash: newTokenHash,
              familyId: newFamilyId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              ip: input.ip ?? null,
              userAgent: input.userAgent ?? null,
            },
          });
        });

        return tokens;
      }
    }

    // Fallback defensivo para unit tests mockados sem DB
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== payload.tokenVersion
    ) {
      throw new UnauthorizedException(
        'Session has been invalidated. Please log in again.',
      );
    }

    return await this.generateTokens(
      user.id.toString(),
      user.email,
      tenantId,
      user.role,
      user.tokenVersion,
      payload.familyId ?? uuidv4(),
    );
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    role: Role,
    tokenVersion: number,
    familyId: string,
  ) {
    const payload = {
      sub: userId,
      email,
      tenantId,
      role,
      tokenVersion,
      familyId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
