import { UnauthorizedException } from '@nestjs/common';
import { User } from '../../../domain/entities/users/user.entity';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

const TEST_USER_ID = '11111111-1111-4111-a111-111111111111';

const makeUser = (overrides: any = {}, id = TEST_USER_ID) =>
  User.create(
    {
      email: 'user@mail.com',
      passwordHash: 'hashed-password',
      role: 'USER',
      name: 'Test User',
      active: true,
      tokenVersion: 1,
      ...overrides,
    },
    new UniqueEntityID(id),
  );

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepository: any;
  let jwtService: any;
  let configService: any;
  let refreshTokenRepository: any;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    jwtService = {
      verify: jest.fn(),
      signAsync: jest.fn().mockResolvedValue('new-fake-token'),
    };
    configService = {
      get: jest.fn().mockReturnValue('secret'),
    };
    refreshTokenRepository = {
      findByTokenHash: jest.fn(),
      revokeFamily: jest.fn(),
      rotateToken: jest.fn(),
      recordSecurityAlert: jest.fn(),
      create: jest.fn(),
    };

    useCase = new RefreshTokenUseCase(
      userRepository,
      jwtService,
      configService,
      refreshTokenRepository,
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(
      useCase.execute({ refreshToken: 'invalid-token' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
  });

  it('should detect token reuse (theft alert), revoke token family, bump user tokenVersion and throw', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      tokenVersion: 1,
    });

    // Token already revoked/replaced
    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'token-old-id',
      familyId: 'family-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      revokedAt: new Date(Date.now() - 60000),
      replacedByTokenId: 'token-newer-id',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const user = makeUser({ tokenVersion: 1 });
    userRepository.findById.mockResolvedValue(user);

    await expect(
      useCase.execute({
        refreshToken: 'stolen-reused-token',
        ip: '127.0.0.1',
        userAgent: 'curl/7.68.0',
      }),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Security violation: Refresh token reuse detected. All sessions revoked.',
      ),
    );

    // Family revoked via repository
    expect(refreshTokenRepository.revokeFamily).toHaveBeenCalledWith(
      'family-1',
    );

    // Audit log / security alert created via repository
    expect(refreshTokenRepository.recordSecurityAlert).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      userId: 'user-1',
      familyId: 'family-1',
      revokedTokenId: 'token-old-id',
      ip: '127.0.0.1',
      userAgent: 'curl/7.68.0',
    });

    // User token version bumped to revoke all active access tokens
    expect(user.tokenVersion).toBe(2);
    expect(userRepository.update).toHaveBeenCalledWith('tenant-1', user);
  });

  it('should throw UnauthorizedException if refresh token is expired', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      tokenVersion: 1,
    });

    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'token-1',
      familyId: 'family-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() - 1000), // expired
    });

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(new UnauthorizedException('Refresh token has expired'));
  });

  it('should throw UnauthorizedException if tokenVersion mismatch', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      tokenVersion: 1,
    });

    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'token-1',
      familyId: 'family-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // User has bumped tokenVersion (e.g. password changed or logged out)
    const user = makeUser({ tokenVersion: 2 });
    userRepository.findById.mockResolvedValue(user);

    await expect(
      useCase.execute({ refreshToken: 'stale-token' }),
    ).rejects.toThrow(
      new UnauthorizedException(
        'Session has been invalidated. Please log in again.',
      ),
    );
  });

  it('should successfully rotate tokens in the same family', async () => {
    jwtService.verify.mockReturnValue({
      sub: 'user-1',
      tenantId: 'tenant-1',
      tokenVersion: 1,
    });

    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'token-1',
      familyId: 'family-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      revokedAt: null,
      replacedByTokenId: null,
      expiresAt: new Date(Date.now() + 86400000),
    });

    const user = makeUser({ tokenVersion: 1 });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute({ refreshToken: 'valid-token' });

    expect(result.accessToken).toBe('new-fake-token');
    expect(result.refreshToken).toBe('new-fake-token');

    // Token rotated atomically via repository
    expect(refreshTokenRepository.rotateToken).toHaveBeenCalledWith(
      'token-1',
      expect.objectContaining({
        familyId: 'family-1',
        tenantId: 'tenant-1',
        userId: TEST_USER_ID,
      }),
    );
  });
});
