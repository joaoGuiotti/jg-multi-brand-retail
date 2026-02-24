import { AuthPresenter, UserProfilePresenter } from '../auth.presenter';

const makeAuthOutput = (overrides: any = {}) => ({
    user: {
        id: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        role: 'USER',
        tenant: { id: 'tenant-1', name: 'Acme', slug: 'acme' },
    },
    accessToken: 'access',
    refreshToken: 'refresh',
    ...overrides,
});

describe('AuthPresenter', () => {
    it('should construct from AuthOutput', () => {
        const presenter = new AuthPresenter(makeAuthOutput());
        expect(presenter.user.email).toBe('a@b.com');
        expect(presenter.accessToken).toBe('access');
        expect(presenter.refreshToken).toBe('refresh');
        expect(presenter.user.tenant.slug).toBe('acme');
    });
});

const makeProfileOutput = (overrides: any = {}) => ({
    id: 'user-1',
    email: 'a@b.com',
    name: 'Alice',
    role: 'USER',
    active: true,
    tenant: { id: 'tenant-1', name: 'Acme', slug: 'acme' },
    ...overrides,
});

describe('UserProfilePresenter', () => {
    it('should construct from UserProfileOutput with tenant', () => {
        const presenter = new UserProfilePresenter(makeProfileOutput());
        expect(presenter.email).toBe('a@b.com');
        expect(presenter.tenant?.slug).toBe('acme');
        expect(presenter.active).toBe(true);
    });

    it('should handle null tenant', () => {
        const presenter = new UserProfilePresenter(makeProfileOutput({ tenant: null }));
        expect(presenter.tenant).toBeNull();
    });
});
