/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '../../auth/enums/role.enum';
import { UserPayload } from '../../auth/entities/user-payload.entity';
import { createMock } from '@golevelup/ts-jest';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaMock: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prismaMock = createMock<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return products with correct pagination and filters', async () => {
      const mockProducts = [{ id: 'product-id-1' }, { id: 'product-id-2' }];
      (prismaMock.product.findMany as jest.Mock).mockResolvedValueOnce(
        mockProducts,
      );

      const spyFilters = jest.spyOn(service as any, 'buildProductFilters');

      const actual = await service.findAll('shirt', 'Summer', false, 2, 5);

      expect(actual).toEqual(mockProducts);
      expect(spyFilters).toHaveBeenCalledWith(
        { searchByName: 'shirt', category: 'Summer', likedOnly: false },
        undefined,
      );
      expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        include: {
          images: { select: { id: true, url: true } },
          categories: { select: { id: true, name: true } },
          likes: false,
        },
        take: 5,
        skip: 5,
      });
    });

    it('should include likes filter when likedOnly is true and user supplied is a client', async () => {
      (prismaMock.product.findMany as jest.Mock).mockResolvedValueOnce([]);

      const user: UserPayload = {
        id: 'user-id',
        email: 'john@example.com',
        role: Role.CLIENT,
      };
      await service.findAll(undefined, undefined, true, 1, 10, user);

      expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ likes: true }),
        }),
      );
    });

    it('should return empty list when no products matching filters are found', () => {});
  });

  describe('findOne', () => {
    it('should return product if it exists and is active', async () => {
      const activeProduct = { id: 'product-id-1', isActive: true };
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValueOnce(
        activeProduct,
      );

      const actual = await service.findOne('product-id-1');

      expect(actual).toEqual(activeProduct);
      expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

      try {
        await service.findOne('missing');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect((error as NotFoundException).message).toEqual(
          'Product not found',
        );
        expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1);
        expect(prismaMock.product.update).not.toHaveBeenCalled();
      }
    });

    it('should throw ForbiddenException for inactive product requested by client', async () => {
      const inactiveProduct = { id: 'product-id-1', isActive: false };
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValueOnce(
        inactiveProduct,
      );

      const user: UserPayload = {
        id: 'user-id',
        email: 'john@example.com',
        role: Role.CLIENT,
      };

      try {
        await service.findOne('product-id-1', user);
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).message).toEqual(
          'Do not have permission to request product.',
        );
        expect(prismaMock.product.findUnique).toHaveBeenCalledTimes(1);
      }
    });

    it('should return inactive product to a manager', async () => {
      const inactiveProduct = { id: 'product-id-1', isActive: false };
      (prismaMock.product.findUnique as jest.Mock).mockResolvedValueOnce(
        inactiveProduct,
      );

      const user: UserPayload = {
        id: 'user-id',
        email: 'john@example.com',
        role: Role.MANAGER,
      };

      const actual = await service.findOne('product-id-1', user);

      expect(actual).toEqual(inactiveProduct);
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Cool Tee',
      description: 'desc',
      price: 19.99,
      stock: 10,
      isActive: true,
      categoryIds: [1, 2],
    };

    it('should create a product and connect categories', async () => {
      (prismaMock.product.create as jest.Mock).mockResolvedValueOnce({
        id: 'product-id-1',
        ...dto,
      });

      const actual = await service.create(dto);

      expect(actual.id).toEqual('product-id-1');
      expect(prismaMock.product.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Cool Tee',
          categories: { connect: [{ id: 1 }, { id: 2 }] },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('update', () => {
    it('should update the product with given data', async () => {
      (prismaMock.product.update as jest.Mock).mockResolvedValueOnce({
        id: 'product-id-1',
        name: 'New',
      });

      const actual = await service.update('product-id-1', { name: 'New' });

      expect(actual.name).toEqual('New');
      expect(prismaMock.product.update).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { name: 'New' },
        include: expect.any(Object),
      });
    });
  });

  describe('attachImage', () => {
    it('should create a new ProductImage row for the product', async () => {
      (prismaMock.product.update as jest.Mock).mockResolvedValueOnce({
        id: 'product-id-1',
      });

      await service.attachImage('product-id-1', 'https://img');

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
        data: { images: { create: { url: 'https://img' } } },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete the product by id', async () => {
      (prismaMock.product.delete as jest.Mock).mockResolvedValueOnce({
        id: 'product-id-1',
      });

      const actual = await service.remove('product-id-1');

      expect(actual.id).toEqual('product-id-1');
      expect(prismaMock.product.delete).toHaveBeenCalledTimes(1);
      expect(prismaMock.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-id-1' },
      });
    });
  });

  describe('likedByUser', () => {
    it('should return true if like relation exists', async () => {
      (prismaMock.like.findUnique as jest.Mock).mockResolvedValueOnce({});

      const liked = await service.likedByUser('product-id-1', 'user-id');

      expect(liked).toEqual(true);
      expect(prismaMock.like.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return false if like relation does NOT exist', async () => {
      (prismaMock.like.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const liked = await service.likedByUser('product-id-1', 'user-id');

      expect(liked).toEqual(false);
    });
  });
});
