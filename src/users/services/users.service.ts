import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/auth/dto/signup-auth.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prismaService: PrismaService) {}

  async comparePassword(candidatePassword: string, hashedPassword: string) {
    const isMatch = await bcrypt.compare(candidatePassword, hashedPassword);
    return isMatch;
  }

  async hashSecret(password: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  }

  async findOne(findByCriteria: Prisma.UserWhereUniqueInput) {
    return this.prismaService.user.findUnique({
      where: findByCriteria,
      include: {
        role: true,
        cart: { select: { id: true } },
      },
    });
  }

  async findById(userId: string) {
    return this.findOne({ id: userId });
  }

  async findByEmail(email: string) {
    return this.findOne({ email });
  }

  async create({ password, ...userData }: SignUpDto) {
    const hashedPassword = await this.hashSecret(password);
    return this.prismaService.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        role: {
          connectOrCreate: {
            where: { role: 'client' },
            create: { role: 'client' },
          },
        },
        cart: {
          create: {},
        },
      },
      include: {
        role: true,
        cart: { select: { id: true } },
      },
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await this.hashSecret(newPassword);
    return this.prismaService.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
      include: {
        role: true,
        cart: { select: { id: true } },
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashSecret(refreshToken);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async destroyRefreshToken(userId: string) {
    await this.prismaService.user.updateMany({
      where: {
        id: userId,
        refreshToken: { not: null },
      },
      data: { refreshToken: null },
    });
  }
}
