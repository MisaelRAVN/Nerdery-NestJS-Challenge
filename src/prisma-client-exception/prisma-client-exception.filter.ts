import {
  Catch,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaRequestExceptionFilter implements GqlExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError) {
    const { code, cause } = exception;
    switch (code) {
      case 'P2000': {
        throw new BadRequestException('The value is too long for the column', {
          cause,
        });
      }
      case 'P2001': {
        throw new NotFoundException('Record not found.', { cause });
      }
      case 'P2002': {
        throw new ConflictException('Unique constraint failed', { cause });
      }
      case 'P2003': {
        throw new BadRequestException('Foreign key constraint failed.', {
          cause,
        });
      }
      case 'P2004': {
        throw new BadRequestException('A database constraint failed.', {
          cause,
        });
      }
      case 'P2005': {
        throw new BadRequestException('Invalid value for field.', { cause });
      }
      case 'P2006': {
        throw new BadRequestException('Invalid value for a required field.', {
          cause,
        });
      }
      case 'P2007': {
        throw new BadRequestException('Data validation error.', { cause });
      }
      case 'P2011': {
        throw new BadRequestException(
          'Null constraint violation on non-null field.',
          { cause },
        );
      }
      case 'P2013': {
        throw new BadRequestException('Missing required value.', { cause });
      }
      case 'P2014': {
        throw new ConflictException(
          'Change will break relation between models.',
          { cause },
        );
      }
      case 'P2015': {
        throw new NotFoundException('NRelated record not found.', {
          cause,
        });
      }
      case 'P2017': {
        throw new NotFoundException('No relation between models exist.', {
          cause,
        });
      }
      case 'P2020': {
        throw new BadRequestException('Value out of range for the field.', {
          cause,
        });
      }
      case 'P2021': {
        throw new NotFoundException(
          'Requested table not found in the database.',
          { cause },
        );
      }
      case 'P2022': {
        throw new NotFoundException('Column not found in the database.', {
          cause,
        });
      }
      case 'P2023': {
        throw new BadRequestException('Inconsistent column data.', { cause });
      }
      case 'P2025': {
        throw new NotFoundException('Record to update/delete does not exist.', {
          cause,
        });
      }
    }
  }
}
