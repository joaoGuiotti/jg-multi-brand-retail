import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';
import { User } from '../../../domain/entities/users/user.entity';
import { LoginUseCase } from './login.use-case';

// Mock bcrypt at module level to avoid ESM issues
jest.mock('bcrypt', () => ({
    compare: jest.fn(),
    hash: jest.fn(),
}));

const makeUser = (overrides: any = {}) =>
    User.create({
        tenantId: 'tenant-1',
        email: 'test@mail.com',
        passwordHash: 'hashed-password',
        role: 'USER',
        name: 'Test User',
        active: true,
        ...overrides,
    });

const makeTenant = (overrides: any = {}) =>
    Tenant.create({
        name: 'Acme',
        slug: 'acme',
        active: true,
        ...overrides,
    });

describe('LoginUseCase', () => {
    let useCase: LoginUseCase;
    let userRepository: any;
    let tenantRepository: any;
    let jwtService: any;
    let configService: any;

    beforeEach(() => {
        jest.clearAllMocks();
        userRepository = { findByEmail: jest.fn() };
        tenantRepository = { findById: jest.fn() };
        jwtService = { signAsync: jest.fn().mockResolvedValue('fake-token') };
        configService = { get: jest.fn().mockReturnValue('secret') };
        useCase = new LoginUseCase(userRepository, tenantRepository, jwtService, configService);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        await expect(useCase.execute({ email: 'x@mail.com', password: '123' }))
            .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
        userRepository.findByEmail.mockResolvedValue(makeUser({ active: false }));
        await expect(useCase.execute({ email: 'x@mail.com', password: '123' }))
            .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if tenant is not found', async () => {
        userRepository.findByEmail.mockResolvedValue(makeUser());
        tenantRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ email: 'test@mail.com', password: '123' }))
            .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if tenant is inactive', async () => {
        userRepository.findByEmail.mockResolvedValue(makeUser());
        tenantRepository.findById.mockResolvedValue(makeTenant({ active: false }));
        await expect(useCase.execute({ email: 'test@mail.com', password: '123' }))
            .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
        userRepository.findByEmail.mockResolvedValue(makeUser());
        tenantRepository.findById.mockResolvedValue(makeTenant());
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        await expect(useCase.execute({ email: 'test@mail.com', password: 'wrong' }))
            .rejects.toThrow(UnauthorizedException);
    });

    it('should return user and tokens on successful login', async () => {
        const user = makeUser();
        const tenant = makeTenant();
        userRepository.findByEmail.mockResolvedValue(user);
        tenantRepository.findById.mockResolvedValue(tenant);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        const result = await useCase.execute({ email: 'test@mail.com', password: 'correct' });
        expect(result.user.email).toBe('test@mail.com');
        expect(result.accessToken).toBe('fake-token');
        expect(result.refreshToken).toBe('fake-token');
    });
});
