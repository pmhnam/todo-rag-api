import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';
import process from 'node:process';
import validateConfig from '../../utils/validate-config';
import { StorageConfig } from './storage-config.type';

class EnvironmentVariablesValidator {
  @IsUrl({ require_tld: false })
  @IsOptional()
  STORAGE_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  STORAGE_REGION?: string;

  @IsString()
  @IsOptional()
  STORAGE_BUCKET?: string;

  @IsString()
  @IsOptional()
  STORAGE_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  STORAGE_SECRET_ACCESS_KEY?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  STORAGE_PUBLIC_BASE_URL?: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  @IsOptional()
  STORAGE_PRESIGN_EXPIRES_SECONDS?: number;
}

export default registerAs<StorageConfig>('storage', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || 'auto',
    bucket: process.env.STORAGE_BUCKET,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    publicBaseUrl: process.env.STORAGE_PUBLIC_BASE_URL,
    presignExpiresSeconds: process.env.STORAGE_PRESIGN_EXPIRES_SECONDS
      ? parseInt(process.env.STORAGE_PRESIGN_EXPIRES_SECONDS, 10)
      : 300,
  };
});
