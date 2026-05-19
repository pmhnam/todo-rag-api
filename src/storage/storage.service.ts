import { AllConfigType } from '@/config/config.type';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const endpoint = this.configService.get('storage.endpoint', {
      infer: true,
    });
    const accessKeyId = this.configService.get('storage.accessKeyId', {
      infer: true,
    });
    const secretAccessKey = this.configService.get('storage.secretAccessKey', {
      infer: true,
    });

    this.client = new S3Client({
      region: this.configService.getOrThrow('storage.region', { infer: true }),
      endpoint,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async createPresignedPutUrl(key: string, contentType: string) {
    const bucket = this.configService.get('storage.bucket', { infer: true });
    const publicBaseUrl = this.configService.get('storage.publicBaseUrl', {
      infer: true,
    });

    if (!bucket || !publicBaseUrl) {
      throw new InternalServerErrorException('Storage is not configured');
    }

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.configService.getOrThrow(
        'storage.presignExpiresSeconds',
        {
          infer: true,
        },
      ),
      signableHeaders: new Set(['content-type']),
    });

    return {
      uploadUrl,
      publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${key}`,
      headers: { 'Content-Type': contentType },
    };
  }
}
