import { Resolver, Mutation } from '@nestjs/graphql';
import { ImagesService } from './services/images.service';
import { Image } from './entities/image.entity';
import { SignedUploadPayload } from './entities/signed-upload-payload.entity';

@Resolver(() => Image)
export class ImagesResolver {
  constructor(private readonly imagesService: ImagesService) {}

  @Mutation(() => SignedUploadPayload)
  generateSignedUploadPayload() {
    return this.imagesService.generateSignedUploadPayload();
  }
}
