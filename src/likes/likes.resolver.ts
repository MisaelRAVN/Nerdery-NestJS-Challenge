import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { LikesService } from './services/likes.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Resolver()
export class LikesResolver {
  constructor(private readonly likesService: LikesService) {}

  @Roles(Role.CLIENT)
  @Mutation(() => Boolean)
  async toggleLike(
    @Args('productId', { type: () => ID }, ParseUUIDPipe) productId: string,
    @CurrentUser() user: ClientPayload,
  ) {
    return this.likesService.toggleLike(productId, user.id);
  }
}
