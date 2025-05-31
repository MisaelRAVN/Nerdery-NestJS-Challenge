import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {}

  generateUploadPayload() {
    const timestamp = Date.now();
    const apiSecret =
      this.configService.get<string>('CLOUDINARY_API_SECRET') ?? '';
    const signature = cloudinary.utils.api_sign_request(
      { timestamp },
      apiSecret,
    );

    const cloudName =
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') ?? '';
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY') ?? '';
    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      apiKey,
      timestamp,
      signature,
    };
  }
}
