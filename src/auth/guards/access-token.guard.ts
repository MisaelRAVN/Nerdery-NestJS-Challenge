import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_ROUTE_METADATA_KEY } from '../decorators/public.decorator';
import { ROLES_METADATA_KEY } from '../decorators/roles.decorator';
import { UserPayload } from '../entities/user-payload.entity';
import { Role } from '../enums/role.enum';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    if (ctx.getType() === 'graphql') {
      return ctx.getContext<{ req: Request }>().req;
    }
    return context.switchToHttp().getRequest<{ req: Request }>();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      throw new UnauthorizedException();
    }

    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_ROUTE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublicRoute) {
      return user;
    }

    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowedRoles) {
      const payload = user as UserPayload;
      const userRole = payload.role;
      const isAuthorized = allowedRoles.includes(userRole);
      if (!isAuthorized) {
        throw new ForbiddenException();
      }
    }
    return user;
  }
}
