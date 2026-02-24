import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const makeMockContext = (overrides: any = {}) => ({
    getHandler: jest.fn().mockReturnValue('handler'),
    getClass: jest.fn().mockReturnValue('class'),
    switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { role: 'USER' } }),
    }),
    ...overrides,
});

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: jest.Mocked<Reflector>;

    beforeEach(() => {
        reflector = { getAllAndOverride: jest.fn() } as any;
        guard = new RolesGuard(reflector);
    });

    it('should allow access when no roles are required', () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        const context = makeMockContext();
        expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should allow access when user has the required role', () => {
        reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'USER']);
        const context = makeMockContext();
        expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should deny access when user does not have the required role', () => {
        reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
        const context = makeMockContext();
        expect(guard.canActivate(context as any)).toBe(false);
    });
});
