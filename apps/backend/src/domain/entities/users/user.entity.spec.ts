import { User } from './user.entity';

const makeUser = (overrides: Partial<Parameters<typeof User.create>[0]> = {}) =>
  User.create({
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'USER',
    name: 'Test User',
    active: true,
    ...overrides,
  });

describe('User Entity', () => {
  it('Should create a User', () => {
    const user = makeUser();
    expect(user).toBeDefined();
  });

  it('Should create a User with default values', () => {
    const user = makeUser();
    expect(user.active).toBe(true);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it('Should create a User with optional values', () => {
    const user = makeUser({ twoFaSecret: 'secret' });
    expect(user.twoFaSecret).toBe('secret');
  });

  it('Should expose all properties', () => {
    const user = makeUser();
    expect(user.email).toBe('test@example.com');
    expect(user.passwordHash).toBe('hash');
    expect(user.role).toBe('USER');
    expect(user.name).toBe('Test User');
    expect(user.active).toBe(true);
  });

  describe('activate()', () => {
    it('should set active to true', () => {
      const user = makeUser({ active: false });
      user.activate();
      expect(user.active).toBe(true);
    });

    it('should update updatedAt', () => {
      const user = makeUser({ active: false });
      const before = user.updatedAt;
      user.activate();
      expect(user.updatedAt).not.toBe(before);
    });
  });

  describe('deactivate()', () => {
    it('should set active to false', () => {
      const user = makeUser();
      user.deactivate();
      expect(user.active).toBe(false);
    });

    it('should update updatedAt', () => {
      const user = makeUser();
      const before = user.updatedAt;
      user.deactivate();
      expect(user.updatedAt).not.toBe(before);
    });
  });

  describe('updateName()', () => {
    it('should update the name', () => {
      const user = makeUser();
      user.updateName('New Name');
      expect(user.name).toBe('New Name');
    });
  });

  describe('updateRole()', () => {
    it('should update the role', () => {
      const user = makeUser();
      user.updateRole('ADMIN');
      expect(user.role).toBe('ADMIN');
    });
  });

  describe('toJson()', () => {
    it('should return a plain object with all user properties', () => {
      const user = makeUser();
      const json = user.toJson();
      expect(json.id).toBeDefined();
      expect(json.email).toBe('test@example.com');
      expect(json.name).toBe('Test User');
      expect(json.role).toBe('USER');
      expect(json.active).toBe(true);
    });
  });
});
