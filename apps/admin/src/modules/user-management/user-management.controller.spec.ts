import { Test, TestingModule } from '@nestjs/testing';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';

describe('UserManagementController', () => {
  let controller: UserManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManagementController],
      providers: [
        {
          provide: UserManagementService,
          useValue: {
            getUsers: jest.fn().mockResolvedValue({ users: [], total: 0 }),
            getUserById: jest.fn().mockResolvedValue(null),
            updateUser: jest.fn().mockResolvedValue(null),
            suspendUser: jest.fn().mockResolvedValue(null),
            unsuspendUser: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    controller = module.get<UserManagementController>(UserManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return users list', async () => {
    const result = await controller.getUsers(1, 20);
    expect(result).toBeDefined();
  });
});
