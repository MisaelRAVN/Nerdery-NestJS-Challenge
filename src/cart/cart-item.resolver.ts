import { Resolver, ResolveField, Parent, Float } from '@nestjs/graphql';
import { CartItem } from './entities/cart-item.entity';

@Resolver(() => CartItem)
export class CartItemResolver {
  @ResolveField(() => Float)
  itemTotal(@Parent() item: CartItem): number {
    return item.quantity * item.product.price;
  }
}
