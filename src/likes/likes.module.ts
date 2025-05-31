import { Module } from '@nestjs/common';
import { LikesResolver } from './likes.resolver';
import { LikesService } from './services/likes.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  providers: [LikesResolver, LikesService, PrismaService],
})
export class LikesModule {}
