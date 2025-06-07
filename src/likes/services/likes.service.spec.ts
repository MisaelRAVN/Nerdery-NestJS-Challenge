/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from './likes.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('LikesService', () => {
  let service: LikesService;
  let mockPrisma: DeepMocked<PrismaService>;

  beforeEach(async () => {
    mockPrisma = createMock<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const productId = 'product-id-123';
  const userId = 'user-id-456';

  describe('toggleLike', () => {
    it('should remove the like if it already exists', async () => {
      (mockPrisma.like.findUnique as jest.Mock).mockResolvedValue({
        likedAt: new Date(),
      });
      (mockPrisma.like.delete as jest.Mock).mockResolvedValue({});

      const actual = await service.toggleLike(productId, userId);

      expect(mockPrisma.like.findUnique).toHaveBeenCalledWith({
        where: { userId_productId: { userId, productId } },
        select: { likedAt: true },
      });
      expect(mockPrisma.like.delete).toHaveBeenCalledWith({
        where: { userId_productId: { userId, productId } },
      });
      expect(mockPrisma.like.create).not.toHaveBeenCalled();
      expect(actual).toEqual(false);
    });

    it('should create a like if it does not exist', async () => {
      (mockPrisma.like.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.like.create as jest.Mock).mockResolvedValue({});

      const actual = await service.toggleLike(productId, userId);

      expect(mockPrisma.like.findUnique).toHaveBeenCalledWith({
        where: { userId_productId: { userId, productId } },
        select: { likedAt: true },
      });
      expect(mockPrisma.like.delete).not.toHaveBeenCalled();
      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: { userId, productId },
      });
      expect(actual).toEqual(true);
    });

    it('should throw error if either product or user does not exist', async () => {
      (mockPrisma.like.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.like.create as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed on the field: `productId`'),
      );

      await expect(service.toggleLike(productId, userId)).rejects.toThrow();
      expect(mockPrisma.like.delete).not.toHaveBeenCalled();
      expect(mockPrisma.like.create).toHaveBeenCalledTimes(1);
    });
  });
});
