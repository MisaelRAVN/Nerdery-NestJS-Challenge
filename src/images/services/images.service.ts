import { Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/common/cloudinary/services/cloudinary.service';

@Injectable()
export class ImagesService {
  constructor(private cloudinaryService: CloudinaryService) {}

  generateSignedUploadPayload() {
    return this.cloudinaryService.generateUploadPayload();
  }
}
