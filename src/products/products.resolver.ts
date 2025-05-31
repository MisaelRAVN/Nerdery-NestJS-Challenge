import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ProductsService } from './services/products.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { UserPayload } from 'src/auth/entities/user-payload.entity';
import { ClientPayload } from 'src/auth/entities/client-payload.entity';
import { AccessTokenGuard } from 'src/auth/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Resolver(() => Product)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Query(() => [Product], { name: 'allProducts' })
  findAll(
    @Args('searchByName', { nullable: true }) searchByName?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('likedOnly', { nullable: true }) likedOnly?: boolean,
    @Args('page', { defaultValue: 1, type: () => Int }) page?: number,
    @Args('limit', { defaultValue: 10, type: () => Int }) limit?: number,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.productsService.findAll(
      searchByName,
      category,
      likedOnly,
      page,
      limit,
      user,
    );
  }

  @Public()
  @Query(() => Product, { name: 'product' })
  findOne(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @CurrentUser() user?: UserPayload,
  ) {
    return this.productsService.findOne(id, user);
  }

  @Roles(Role.MANAGER)
  @Mutation(() => Product)
  createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    return this.productsService.create(createProductInput);
  }

  @Roles(Role.MANAGER)
  @Mutation(() => Product)
  updateProduct(
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return this.productsService.update(id, updateProductInput);
  }

  @Roles(Role.MANAGER)
  @Mutation(() => Product)
  removeProduct(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Roles(Role.MANAGER)
  @Mutation(() => Product)
  attachProductImage(
    @Args('productId', { type: () => ID }, ParseUUIDPipe) productId: string,
    @Args('imagePublicUrl') imagePublicUrl: string,
  ) {
    return this.productsService.attachImage(productId, imagePublicUrl);
  }

  @ResolveField()
  liked(@Parent() product: Product, @CurrentUser() user: ClientPayload) {
    if (!user) return null;

    const { id } = product;
    return this.productsService.likedByUser(id, user.id);
  }
}
