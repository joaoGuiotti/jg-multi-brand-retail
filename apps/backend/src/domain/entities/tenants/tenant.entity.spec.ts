import { Tenant } from './tenant.entity';

const makeTenant = (overrides?: Partial<Parameters<typeof Tenant.create>[0]>) =>
    Tenant.create({
        name: 'Acme Corp',
        slug: 'acme-corp',
        active: true,
        ...overrides,
    });

describe('Tenant Entity', () => {
    it('should create a tenant with required fields', () => {
        const t = makeTenant();
        expect(t).toBeDefined();
        expect(t.name).toBe('Acme Corp');
        expect(t.slug).toBe('acme-corp');
        expect(t.active).toBe(true);
    });

    it('should set default dates', () => {
        const t = makeTenant();
        expect(t.createdAt).toBeDefined();
        expect(t.updatedAt).toBeDefined();
    });

    it('should expose settings', () => {
        const t = makeTenant({ settings: { theme: 'dark' } });
        expect(t.settings).toEqual({ theme: 'dark' });
    });

    describe('activate()', () => {
        it('should set active to true', () => {
            const t = makeTenant({ active: false });
            t.activate();
            expect(t.active).toBe(true);
        });

        it('should update updatedAt', () => {
            const t = makeTenant({ active: false });
            const before = t.updatedAt;
            t.activate();
            expect(t.updatedAt).not.toBe(before);
        });
    });

    describe('deactivate()', () => {
        it('should set active to false', () => {
            const t = makeTenant();
            t.deactivate();
            expect(t.active).toBe(false);
        });

        it('should update updatedAt', () => {
            const t = makeTenant();
            const before = t.updatedAt;
            t.deactivate();
            expect(t.updatedAt).not.toBe(before);
        });
    });

    describe('updateName()', () => {
        it('should update the name', () => {
            const t = makeTenant();
            t.updateName('New Name');
            expect(t.name).toBe('New Name');
        });
    });

    describe('updateSettings()', () => {
        it('should update settings', () => {
            const t = makeTenant();
            t.updateSettings({ currency: 'BRL' });
            expect(t.settings).toEqual({ currency: 'BRL' });
        });
    });
});
