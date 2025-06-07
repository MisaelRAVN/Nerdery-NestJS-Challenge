import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryInput } from '../dto/create-category.input';
import { UpdateCategoryInput } from '../dto/update-category.input';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create({ name }: CreateCategoryInput) {
    return this.prismaService.category.create({
      data: { name },
    });
  }

  async findAll() {
    return this.prismaService.category.findMany({});
  }

  async findOne(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException('Category not found', {
        description: 'No category matching requested id',
      });
    }
    return category;
  }

  async update(id: number, { name }: UpdateCategoryInput) {
    return this.prismaService.category.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: number) {
    return this.prismaService.category.delete({
      where: { id },
    });
  }
}
