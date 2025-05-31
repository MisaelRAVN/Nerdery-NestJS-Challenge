import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductInput } from '../dto/create-product.input';
import { UpdateProductInput } from '../dto/update-product.input';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UserPayload } from 'src/auth/entities/user-payload.entity';
import { Role } from 'src/auth/enums/role.enum';
import { BuildProductFiltersType } from '../types/build-product-filter.type';

@Injectable()
export class ProductsService {
  constructor(private prismaService: PrismaService) {}

  async findAll(
    searchByName?: string,
    category?: string,
    likedOnly?: boolean,
    page: number = 1,
    limit: number = 10,
    user?: UserPayload,
  ) {
    const filters = this.buildProductFilters(
      {
        searchByName,
        category,
        likedOnly,
      },
      user,
    );
    return this.prismaService.product.findMany({
      where: filters,
      include: {
        images: { select: { id: true, url: true } },
        categories: { select: { id: true, name: true } },
        likes: user?.id != null,
      },
      take: limit,
      skip: (page - 1) * limit,
    });
  }

  async findOne(id: string, user?: UserPayload) {
    const product = await this.prismaService.product.findUnique({
      where: { id },
      include: {
        images: true,
        categories: true,
        likes: user?.id != null,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found', {
        description: 'No product matching requested id',
      });
    }
    if (!product.isActive && user?.role !== Role.MANAGER) {
      throw new ForbiddenException(
        'Do not have permission to request product.',
        {
          description:
            'Server refused to perform action due to insufficient rights',
        },
      );
    }
    return product;
  }

  async create({ categoryIds, ...productData }: CreateProductInput) {
    return this.prismaService.product.create({
      data: {
        ...productData,
        categories: {
          connect: categoryIds.map((categoryId) => ({
            id: categoryId,
          })),
        },
      },
      include: {
        images: { select: { id: true, url: true } },
        categories: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, updateProductInput: UpdateProductInput) {
    return this.prismaService.product.update({
      where: { id },
      data: {
        ...updateProductInput,
      },
      include: {
        images: { select: { id: true, url: true } },
        categories: { select: { id: true, name: true } },
      },
    });
  }

  async attachImage(productId: string, imageUrl: string) {
    /*
    await this.prismaService.productImage.create({
      data: {
        url: imageUrl,
        productId,
      },
    });
    return this.findOne(productId);
    */
    return this.prismaService.product.update({
      where: { id: productId },
      data: {
        images: {
          create: {
            url: imageUrl,
          },
        },
      },
      include: {
        images: { select: { id: true, url: true } },
        categories: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    return this.prismaService.product.delete({ where: { id } });
  }

  private buildProductFilters(
    { searchByName, category, likedOnly }: BuildProductFiltersType,
    user?: UserPayload,
  ) {
    const filters: Prisma.ProductWhereInput[] = [];
    if (searchByName) {
      filters.push({
        name: { contains: searchByName, mode: 'insensitive' },
      });
    }
    if (category) {
      filters.push({ categories: { some: { name: category } } });
    }
    if (user?.id && likedOnly) {
      filters.push({ likes: { some: { userId: user.id } } });
    }
    if (!user || user.role === Role.CLIENT) {
      filters.push({ isActive: true });
    }

    return { AND: filters };
  }

  async likedByUser(productId: string, userId: string) {
    const likeRelation = await this.prismaService.like.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
    return likeRelation != null;
  }
}
