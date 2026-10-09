import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let refreshTokenRepository: any;

  beforeEach(() => {
    refreshTokenRepository = {
      findByTokenHash: jest.fn(),
      revokeFamily: jest.fn(),
    };
    useCase = new LogoutUseCase(refreshTokenRepository);
  });

  it('should revoke the token family when refreshToken is provided', async () => {
    refreshTokenRepository.findByTokenHash.mockResolvedValue({
      id: 'token-1',
      familyId: 'family-123',
    });

    const result = await useCase.execute({ refreshToken: 'some-valid-token' });

    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(refreshTokenRepository.revokeFamily).toHaveBeenCalledWith(
      'family-123',
    );
  });

  it('should return successfully even when no refreshToken is provided', async () => {
    const result = await useCase.execute({});
    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
  });
});
