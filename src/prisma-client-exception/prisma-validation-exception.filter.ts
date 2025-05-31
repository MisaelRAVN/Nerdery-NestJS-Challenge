import { BadRequestException, Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements GqlExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    throw new BadRequestException('Invalid request was sent.', {
      cause: exception.cause,
      description:
        'Incorrect input data was provided. Check variables constraints and try again.',
    });
  }
}
