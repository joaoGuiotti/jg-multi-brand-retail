export type RefreshTokenRecord = {
  id: string;
  tenantId: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
  ip?: string | null;
  userAgent?: string | null;
};

export type CreateRefreshTokenData = {
  id?: string;
  tenantId: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  ip?: string | null;
  userAgent?: string | null;
};

export type SecurityAlertData = {
  tenantId: string;
  userId: string;
  familyId: string;
  revokedTokenId: string;
  ip?: string | null;
  userAgent?: string | null;
};

export abstract class RefreshTokenRepository {
  abstract create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord>;
  abstract findByTokenHash(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null>;
  abstract revokeFamily(familyId: string): Promise<void>;
  abstract rotateToken(
    oldTokenId: string,
    newToken: CreateRefreshTokenData,
  ): Promise<RefreshTokenRecord>;
  abstract recordSecurityAlert(data: SecurityAlertData): Promise<void>;
}
