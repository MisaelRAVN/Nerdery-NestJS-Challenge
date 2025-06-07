/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('SALT'),
  hash: jest
    .fn()
    .mockImplementation((data: string) => Promise.resolve(`hashed(${data})`)),
  compare: jest
    .fn()
    .mockImplementation((data: string, encrypted: string) =>
      Promise.resolve(encrypted === `hashed(${data})`),
    ),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaServiceMock: DeepMocked<PrismaService>;

  beforeEach(async () => {
    prismaServiceMock = createMock<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaServiceMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('comparePassword', () => {
    it('should return true if passwords match', async () => {
      const actual = await service.comparePassword('pw', 'hashed(pw)');
      expect(actual).toEqual(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('pw', 'hashed(pw)');
    });

    it('should return false if passwords do not match', async () => {
      const actual = await service.comparePassword('pw', 'hashed(other)');
      expect(actual).toEqual(false);
    });
  });

  describe('hashSecret', () => {
    it('should return a bcrypt hash for the supplied password', async () => {
      const actual = await service.hashSecret('plain');
      expect(actual).toEqual('hashed(plain)');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    });
  });

  describe('findOne', () => {
    it('should return the user when a record is found', async () => {
      const expected = { id: 'user-id', email: 'john@example.com' };
      const inputId = 'user-id';
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: inputId,
        email: 'john@example.com',
      });

      const actual = await service.findOne({ id: inputId });
      expect(actual).toEqual(expected);
      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: inputId },
        include: { role: true, cart: { select: { id: true } } },
      });
    });

    it('should return null if no user is found', async () => {
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );
      const actual = await service.findOne({ id: 'non-existing-user' });
      expect(actual).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user if exists', async () => {
      const expected = { id: 'user-id', email: 'john@example.com' };
      const inputId = 'user-id';
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: inputId,
        email: 'john@example.com',
      });

      const actual = await service.findById(inputId);
      expect(actual).toEqual(expected);
      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: inputId },
        include: { role: true, cart: { select: { id: true } } },
      });
    });

    it('should return null if user does not exist', async () => {
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      const actual = await service.findById('this-id-does-not-exist');
      expect(actual).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user if exists', async () => {
      const expected = { id: 'user-id', email: 'john@example.com' };
      const inputEmail = 'john@example.com';
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
        email: inputEmail,
      });

      const actual = await service.findByEmail(inputEmail);
      expect(actual).toEqual(expected);
    });

    it('should return null if user does not exist', async () => {
      (prismaServiceMock.user.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      const actual = await service.findByEmail('missing@mail.com');
      expect(actual).toBeNull();
    });
  });

  describe('create', () => {
    const dto = {
      email: 'new@mail.com',
      password: 'plain',
      firstName: 'New',
      lastName: 'User',
      phone: '555-1212',
    };

    it('should create a new user with hashed password and default role', async () => {
      (prismaServiceMock.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'new-user-id',
        ...dto,
      });
      const expected = { id: 'new-user-id', ...dto };

      const actual = await service.create(dto);

      expect(prismaServiceMock.user.create).toHaveBeenCalledTimes(1);
      expect(actual.id).toEqual(expected.id);
    });
  });

  describe('updatePassword', () => {
    it('should update the password with a new bcrypt hash', async () => {
      (prismaServiceMock.user.update as jest.Mock).mockResolvedValueOnce({
        id: 'user-id',
      });
      const inputUserId = 'user-id';
      const inputNewPassword = 'new-password';

      await service.updatePassword(inputUserId, inputNewPassword);

      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: inputUserId },
        data: { password: `hashed(${inputNewPassword})` },
        include: { role: true, cart: { select: { id: true } } },
      });
    });
  });

  describe('updateRefreshToken', () => {
    it('should hash and persist the refresh token', async () => {
      const inputUserId = 'user-id';
      const inputRefreshToken = 'REFRESH-TOKEN';
      await service.updateRefreshToken(inputUserId, inputRefreshToken);
      expect(prismaServiceMock.user.update).toHaveBeenCalledWith({
        where: { id: inputUserId },
        data: { refreshToken: `hashed(${inputRefreshToken})` },
      });
    });
  });

  describe('destroyRefreshToken', () => {
    it('should set to null an existing refresh token', async () => {
      const inputUserId = 'user-id';
      await service.destroyRefreshToken(inputUserId);
      expect(prismaServiceMock.user.updateMany).toHaveBeenCalledWith({
        where: { id: inputUserId, refreshToken: { not: null } },
        data: { refreshToken: null },
      });
    });
  });
});
