import { NotFoundException } from '@nestjs/common';
import { Tenant } from '../../../domain/entities/tenants/tenant.entity';
import { User } from '../../../domain/entities/users/user.entity';
import { GetProfileUseCase } from './get-profile.use-case';

const makeUser = (overrides: any = {}) =>
    User.create({
        email: 'test@mail.com', passwordHash: 'h', role: 'USER', name: 'Alice', active: true, ...overrides
    });

const makeTenant = (overrides: any = {}) =>
    Tenant.create({ name: 'Acme', slug: 'acme', active: true, ...overrides });

describe('GetProfileUseCase', () => {
    let useCase: GetProfileUseCase;
    let userRepository: any;
    let tenantRepository: any;

    beforeEach(() => {
        userRepository = { findById: jest.fn() };
        tenantRepository = { findById: jest.fn() };
        useCase = new GetProfileUseCase(userRepository, tenantRepository);
    });

    it('should throw NotFoundException if user not found', async () => {
        userRepository.findById.mockResolvedValue(null);
        await expect(useCase.execute({ userId: 'u1', tenantId: 'tenant-1' })).rejects.toThrow(NotFoundException);
    });

    it('should return profile with tenant when tenant exists', async () => {
        const user = makeUser();
        const tenant = makeTenant();
        userRepository.findById.mockResolvedValue(user);
        tenantRepository.findById.mockResolvedValue(tenant);

        const result = await useCase.execute({ userId: 'u1', tenantId: 'tenant-1' });
        expect(result.email).toBe('test@mail.com');
        expect(result.tenant).not.toBeNull();
        expect(result.tenant?.name).toBe('Acme');
    });

    it('should return profile with null tenant when tenant is not found', async () => {
        const user = makeUser();
        userRepository.findById.mockResolvedValue(user);
        tenantRepository.findById.mockResolvedValue(null);

        const result = await useCase.execute({ userId: user.id.toString(), tenantId: 'tenant-1' });
        expect(result.tenant).toBeNull();
    });
});
