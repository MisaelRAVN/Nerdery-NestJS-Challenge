import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Order } from './entities/order.entity';
import { OrdersService } from './services/orders.service';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserPayload } from 'src/auth/entities/user-payload.entity';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Resolver(() => Order)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  @Roles(Role.MANAGER)
  @Query(() => [Order])
  allOrders() {
    return this.ordersService.findAll();
  }

  @Roles(Role.CLIENT)
  @Query(() => [Order])
  myOrders(@CurrentUser() user: ClientPayload) {
    return this.ordersService.findAll(user.id);
  }

  @Roles(Role.CLIENT, Role.MANAGER)
  @Query(() => Order)
  order(
    @Args('orderId', { type: () => ID }, ParseUUIDPipe) orderId: string,
    @CurrentUser() user: UserPayload,
  ) {
    return this.ordersService.findOne(orderId, user);
  }
}
