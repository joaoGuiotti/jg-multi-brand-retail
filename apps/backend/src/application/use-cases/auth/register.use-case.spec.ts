import { ConflictException } from '@nestjs/common';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';
import { RegisterUseCase } from './register.use-case';

const makeInput = (overrides: any = {}) => ({
    email: 'new@mail.com',
    password: 'pass123',
    name: 'New User',
    tenantName: 'Acme Corp',
    ...overrides,
});

const makeTenant = (overrides: any = {}) =>
    Tenant.create({
        name: 'Acme Corp',
        slug: 'acme-corp',
        active: true,
        ...overrides,
    });

describe('RegisterUseCase', () => {
    let useCase: RegisterUseCase;
    let userRepository: any;
    let tenantRepository: any;
    let jwtService: any;
    let configService: any;

    beforeEach(() => {
        userRepository = {
            findByEmail: jest.fn(),
            countByTenant: jest.fn().mockResolvedValue(0),
            create: jest.fn(),
        };
        tenantRepository = {
            findBySlug: jest.fn(),
            create: jest.fn(),
        };
        jwtService = {
            signAsync: jest.fn().mockResolvedValue('fake-token'),
        };
        configService = {
            get: jest.fn().mockReturnValue('secret'),
        };
        useCase = new RegisterUseCase(userRepository, tenantRepository, jwtService, configService);
    });

    it('should throw ConflictException if email already exists', async () => {
        userRepository.findByEmail.mockResolvedValue({ user: {}, tenantId: 't1' });
        await expect(useCase.execute(makeInput())).rejects.toThrow(ConflictException);
    });

    it('should create a new tenant if slug does not exist', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(null);
        userRepository.create.mockImplementation(async (tenantId, user) => user);

        await useCase.execute(makeInput());
        expect(tenantRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should reuse existing tenant if slug matches', async () => {
        const existingTenant = makeTenant();
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(existingTenant);
        userRepository.create.mockImplementation(async (user) => user);

        await useCase.execute(makeInput());
        expect(tenantRepository.create).not.toHaveBeenCalled();
    });

    it('should assign ADMIN role to the first user in a tenant', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(makeTenant());
        userRepository.countByTenant.mockResolvedValue(0);
        let createdUser: any;
        userRepository.create.mockImplementation(async (tenantId, user) => { createdUser = user; return user; });

        await useCase.execute(makeInput());
        expect(createdUser.role).toBe('ADMIN');
    });

    it('should assign USER role to subsequent users in a tenant', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(makeTenant());
        userRepository.countByTenant.mockResolvedValue(5);
        let createdUser: any;
        userRepository.create.mockImplementation(async (tenantId, user) => { createdUser = user; return user; });

        await useCase.execute(makeInput());
        expect(createdUser.role).toBe('USER');
    });

    it('should return auth output with tokens', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(makeTenant());
        userRepository.create.mockImplementation(async (user) => user);

        const result = await useCase.execute(makeInput());
        expect(result.accessToken).toBe('fake-token');
        expect(result.refreshToken).toBe('fake-token');
    });

    it('should normalize tenant slug from tenantName', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(null);
        userRepository.create.mockImplementation(async (user) => user);

        await useCase.execute(makeInput({ tenantName: 'My Company' }));
        expect(tenantRepository.findBySlug).toHaveBeenCalledWith('my-company');
    });

    it('should use explicit tenantSlug if provided', async () => {
        userRepository.findByEmail.mockResolvedValue(null);
        tenantRepository.findBySlug.mockResolvedValue(null);
        userRepository.create.mockImplementation(async (user) => user);

        await useCase.execute(makeInput({ tenantSlug: 'custom-slug' }));
        expect(tenantRepository.findBySlug).toHaveBeenCalledWith('custom-slug');
    });
});
