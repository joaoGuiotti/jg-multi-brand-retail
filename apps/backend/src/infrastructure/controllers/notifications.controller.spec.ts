import { NotificationsController } from './notifications.controller';
import { AuthenticatedUser } from '../decorators/authenticated-user.interface';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let findAllUseCase: any;
  let getPrefsUseCase: any;
  let updatePrefUseCase: any;
  let markAsReadUseCase: any;
  let markAllAsReadUseCase: any;
  let repository: any;
  let dispatcher: any;

  const mockUser: AuthenticatedUser = {
    id: 'u1',
    tenantId: 't1',
    email: 'test@test.com',
    role: 'USER',
  };

  beforeEach(() => {
    findAllUseCase = { execute: jest.fn() };
    getPrefsUseCase = { execute: jest.fn() };
    updatePrefUseCase = { execute: jest.fn() };
    markAsReadUseCase = { execute: jest.fn() };
    markAllAsReadUseCase = { execute: jest.fn() };
    repository = { getUnreadCount: jest.fn() };
    dispatcher = { dispatch: jest.fn() };

    controller = new NotificationsController(
      findAllUseCase,
      markAsReadUseCase,
      markAllAsReadUseCase,
      getPrefsUseCase,
      updatePrefUseCase,
      repository,
      dispatcher,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return preferences', async () => {
    getPrefsUseCase.execute.mockResolvedValue([]);
    const result = await controller.getPreferences(mockUser);
    expect(result).toEqual([]);
    expect(getPrefsUseCase.execute).toHaveBeenCalledWith('t1', 'u1');
  });

  it('should update preference', async () => {
    const dto = { type: 'SYSTEM', enabled: true, sound: true } as any;
    updatePrefUseCase.execute.mockResolvedValue(dto);

    const result = await controller.updatePreference(mockUser, dto);

    expect(result).toEqual(dto);
    expect(updatePrefUseCase.execute).toHaveBeenCalledWith('t1', 'u1', dto);
  });

  it('should get unread count', async () => {
    repository.getUnreadCount.mockResolvedValue(5);
    const result = await controller.getUnreadCount(mockUser);
    expect(result).toEqual({ count: 5 });
  });
});
