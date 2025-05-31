import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SignedUploadPayload {
  @Field()
  uploadUrl: string;

  @Field()
  apiKey: string;

  @Field()
  timestamp: string;

  @Field()
  signature: string;
}
