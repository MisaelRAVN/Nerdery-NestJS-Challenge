import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryService } from './cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    utils: {
      api_sign_request: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const mockConfig = {
    CLOUDINARY_API_SECRET: 'test_secret',
    CLOUDINARY_CLOUD_NAME: 'demo-cloud',
    CLOUDINARY_API_KEY: '123456',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn(
              (key: keyof typeof mockConfig) => mockConfig[key],
            ),
          },
        },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('generateUploadPayload', () => {
    it('should return upload payload with correct fields', () => {
      const mockTimestamp = 1726500000000;
      const mockSignature = 'signed_hash';
      jest.spyOn(Date, 'now').mockReturnValue(mockTimestamp);
      (cloudinary.utils.api_sign_request as jest.Mock).mockReturnValue(
        mockSignature,
      );

      const expected = {
        uploadUrl: `https://api.cloudinary.com/v1_1/${mockConfig.CLOUDINARY_CLOUD_NAME}/image/upload`,
        apiKey: mockConfig.CLOUDINARY_API_KEY,
        timestamp: mockTimestamp,
        signature: mockSignature,
      };

      const actual = service.generateUploadPayload();

      expect(actual).toEqual(expected);
      expect(cloudinary.utils.api_sign_request).toHaveBeenCalledWith(
        { timestamp: mockTimestamp },
        mockConfig.CLOUDINARY_API_SECRET,
      );
    });
  });
});
