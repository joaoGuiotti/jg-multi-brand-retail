import { LogoutUseCase } from './logout.use-case';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      withAuthLookup: jest.fn(async (cb) => cb(prisma)),
      refreshToken: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    useCase = new LogoutUseCase(prisma);
  });

  it('should revoke the token family when refreshToken is provided', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-1',
      familyId: 'family-123',
    });

    const result = await useCase.execute({ refreshToken: 'some-valid-token' });

    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-123' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('should return successfully even when no refreshToken is provided', async () => {
    const result = await useCase.execute({});
    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });
});
