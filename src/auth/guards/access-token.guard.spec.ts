import { Reflector } from '@nestjs/core';
import {
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';
import { Role } from '../enums/role.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { createMock, DeepMocked } from '@golevelup/ts-jest';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let reflector: DeepMocked<Reflector>;

  const mockContext = createMock<ExecutionContext>({
    getHandler: jest.fn(),
    getClass: jest.fn(),
  });

  const mockGqlContext = createMock<GqlExecutionContext>({
    getType: () => 'graphql',
    getContext: () => ({
      req: { headers: { authorization: 'Bearer token' } },
    }),
  });

  const mockUser = { id: 'user-id', role: Role.CLIENT };

  beforeEach(() => {
    reflector = createMock<Reflector>({
      getAllAndOverride: jest.fn(),
    });

    guard = new AccessTokenGuard(reflector);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getRequest', () => {
    it('should return GraphQL request object on GraphQL contexts', () => {
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext);

      const expected = { headers: { authorization: 'Bearer token' } };
      const actual = guard.getRequest(mockContext);

      expect(actual).toEqual(expected);
    });

    it('should return HTTP request object on non-GraphQL contexts', () => {
      const mockContext = createMock<ExecutionContext>({
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer http-token' },
          }),
        }),
      });
      jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(
        createMock<GqlExecutionContext>({
          getType: () => 'http',
        }),
      );

      const req = guard.getRequest(mockContext);
      expect(req).toEqual({ headers: { authorization: 'Bearer http-token' } });
    });
  });

  describe('handleRequest', () => {
    it('should throw UnauthorizedException if error is passed', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        guard.handleRequest(new Error(), null, null, mockContext),
      ).toThrow(UnauthorizedException);
    });

    it('should return user for public routes', () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const actual = guard.handleRequest(null, mockUser, null, mockContext);
      expect(actual).toBe(mockUser);
    });

    it('should return user if no roles are required', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(undefined);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const actual = guard.handleRequest(null, mockUser, null, mockContext);
      expect(actual).toBe(mockUser);
    });

    it('should throw ForbiddenException if user has wrong role', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.MANAGER]);

      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        guard.handleRequest(null, mockUser, null, mockContext),
      ).toThrow(ForbiddenException);
    });

    it('should return user if role matches', () => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false)
        .mockReturnValueOnce([Role.CLIENT, Role.MANAGER]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const actual = guard.handleRequest(null, mockUser, null, mockContext);
      expect(actual).toBe(mockUser);
    });
  });
});
