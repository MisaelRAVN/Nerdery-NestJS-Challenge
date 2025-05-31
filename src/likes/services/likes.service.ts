import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async toggleLike(productId: string, userId: string) {
    const whereClause = {
      userId_productId: {
        userId,
        productId,
      },
    };

    const existingLike = await this.prisma.like.findUnique({
      where: whereClause,
      select: { likedAt: true },
    });

    if (existingLike) {
      await this.prisma.like.delete({ where: whereClause });
      return false;
    }

    await this.prisma.like.create({ data: { userId, productId } });
    return true;
  }
}
