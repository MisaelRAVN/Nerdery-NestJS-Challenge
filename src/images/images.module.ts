import { Module } from '@nestjs/common';
import { ImagesService } from './services/images.service';
import { ImagesResolver } from './images.resolver';
import { CloudinaryService } from 'src/common/cloudinary/services/cloudinary.service';

@Module({
  providers: [ImagesResolver, ImagesService, CloudinaryService],
})
export class ImagesModule {}
