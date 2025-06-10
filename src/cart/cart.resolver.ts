import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  Args,
  Float,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CartService } from './services/cart.service';
import { Cart } from './entities/cart.entity';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Resolver(() => Cart)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @Roles(Role.CLIENT)
  @Query(() => Cart)
  async cart(@CurrentUser() user: ClientPayload) {
    return this.cartService.getCart(user.id);
  }

  @Roles(Role.CLIENT)
  @Mutation(() => Cart)
  async updateCartItem(
    @Args('productId', { type: () => ID }, ParseUUIDPipe) productId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
    @CurrentUser() user: ClientPayload,
  ) {
    return this.cartService.updateCartItem(user, productId, quantity);
  }

  @Roles(Role.CLIENT)
  @Mutation(() => Cart)
  async removeCartItem(
    @Args('productId', { type: () => ID }, ParseUUIDPipe) productId: string,
    @CurrentUser() user: ClientPayload,
  ) {
    return this.cartService.removeCartItem(user, productId);
  }

  @Roles(Role.CLIENT)
  @Mutation(() => Cart)
  async clearCart(@CurrentUser() user: ClientPayload) {
    return this.cartService.clearCart(user);
  }

  @ResolveField('totalAmount', () => Float)
  getTotalAmount(@Parent() cart: Cart) {
    const totalAmount = cart.items.reduce((acc, curr) => {
      return acc + curr.quantity * curr.product.price;
    }, 0);
    return totalAmount;
  }
}
