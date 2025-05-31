import { Module } from '@nestjs/common';
import { CategoriesService } from './services/categories.service';
import { CategoriesResolver } from './categories.resolver';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [CategoriesResolver, CategoriesService, PrismaService],
})
export class CategoriesModule {}
