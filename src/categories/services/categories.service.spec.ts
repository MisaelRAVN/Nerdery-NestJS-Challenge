/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from '../dto/create-category.input';
import { Category } from '../entities/category.entity';
import { UpdateCategoryInput } from '../dto/update-category.input';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let mockPrisma: DeepMocked<PrismaService>;

  beforeEach(async () => {
    mockPrisma = createMock<PrismaService>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and return a new category', async () => {
      const input: CreateCategoryInput = { name: 'Electronics' };
      const expected = { id: 1, ...input };

      (mockPrisma.category.create as jest.Mock).mockResolvedValue(expected);

      const actual = await service.create(input);

      expect(mockPrisma.category.create).toHaveBeenCalledWith({ data: input });
      expect(actual).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('should return all categories', async () => {
      const expected: Category[] = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ];

      (mockPrisma.category.findMany as jest.Mock).mockResolvedValue(expected);

      const actual = await service.findAll();

      expect(mockPrisma.category.findMany).toHaveBeenCalled();
      expect(actual).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a category if it exists', async () => {
      const inputId = 1;
      const expected: Category = { id: 1, name: 'A' };

      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(expected);

      const actual = await service.findOne(inputId);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: inputId },
      });
      expect(actual).toEqual(expected);
    });

    it('should throw NotFoundException if the category does not exist', async () => {
      (mockPrisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(99999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update the category if it exists', async () => {
      const updateInput: UpdateCategoryInput = { name: 'New Name' };
      const inputId = 2;
      const expected: Category = { id: 2, name: 'New Name' };

      (mockPrisma.category.update as jest.Mock).mockResolvedValue(expected);

      const actual = await service.update(inputId, updateInput);

      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: inputId },
        data: { name: updateInput.name },
      });
      expect(actual).toEqual(expected);
    });

    it('should throw error if category to update does not exist', async () => {
      (mockPrisma.category.update as jest.Mock).mockRejectedValue(new Error());

      await expect(
        service.update(99999, { name: 'This category does not exist' }),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete the category if it exists', async () => {
      const inputId = 3;
      const expected: Category = { id: 3, name: 'Delete Me' };

      (mockPrisma.category.delete as jest.Mock).mockResolvedValue(expected);

      const actual = await service.remove(inputId);

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: inputId },
      });
      expect(actual).toEqual(expected);
    });

    it('should throw an error if the category does not exist', async () => {
      (mockPrisma.category.delete as jest.Mock).mockRejectedValue(new Error());

      await expect(service.remove(99999)).rejects.toThrow();
    });
  });
});
