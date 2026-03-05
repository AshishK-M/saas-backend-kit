import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../logger';

export interface S3Config {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  key?: string;
  contentType?: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  contentType?: string;
  size?: number;
}

export interface SignedUrlOptions {
  expiresIn?: number;
}

export interface FileObject {
  key: string;
  lastModified?: Date;
  size?: number;
  contentType?: string;
}

class S3Service {
  private client: S3Client | null = null;
  private bucket: string;
  private initialized: boolean = false;

  constructor() {
    this.bucket = '';
  }

  initialize(config: S3Config): void {
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      credentials: config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle || false,
    });

    this.bucket = config.bucket;
    this.initialized = true;
    logger.info('S3 service initialized', { bucket: this.bucket });
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      const region = config.get('AWS_REGION') || 'us-east-1';
      const bucket = config.get('AWS_S3_BUCKET') || '';
      
      this.initialize({
        region,
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY'),
        bucket,
        endpoint: config.get('AWS_ENDPOINT'),
      });
    }
  }

  async upload(
    file: Buffer | Uint8Array | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    this.ensureInitialized();

    const key = options.key || this.generateKey();
    const contentType = options.contentType || this.guessContentType(key);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: options.metadata,
    });

    await this.client!.send(command);

    const url = await this.getSignedUrl(key, { expiresIn: options.expiresIn || 3600 });

    logger.info('File uploaded to S3', { key, bucket: this.bucket, contentType });

    return {
      key,
      url,
      bucket: this.bucket,
      contentType,
    };
  }

  async uploadImage(
    file: Buffer | Uint8Array | string,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = options.key || `images/${Date.now()}-${filename}`;
    
    return this.upload(file, {
      ...options,
      key,
      contentType: options.contentType || this.getImageContentType(filename),
    });
  }

  async uploadVideo(
    file: Buffer | Uint8Array | string,
    filename: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const key = options.key || `videos/${Date.now()}-${filename}`;
    
    return this.upload(file, {
      ...options,
      key,
      contentType: options.contentType || this.getVideoContentType(filename),
    });
  }

  async delete(key: string): Promise<void> {
    this.ensureInitialized();

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client!.send(command);
    logger.info('File deleted from S3', { key, bucket: this.bucket });
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    this.ensureInitialized();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client!, command, {
      expiresIn: options.expiresIn || 3600,
    });
  }

  async getPublicUrl(key: string): Promise<string> {
    return `https://${this.bucket}.s3.${config.get('AWS_REGION') || 'us-east-1'}.amazonaws.com/${key}`;
  }

  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<FileObject[]> {
    this.ensureInitialized();

    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await this.client!.send(command);
    
    return (response.Contents || []).map((item) => ({
      key: item.Key || '',
      lastModified: item.LastModified,
      size: item.Size,
    }));
  }

  private generateKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `uploads/${timestamp}-${random}`;
  }

  private guessContentType(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase();
    
    const contentTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      pdf: 'application/pdf',
      json: 'application/json',
      txt: 'text/plain',
    };

    return contentTypes[ext || ''] || 'application/octet-stream';
  }

  private getImageContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const imageTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };
    return imageTypes[ext || ''] || 'image/jpeg';
  }

  private getVideoContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      ogv: 'video/ogg',
    };
    return videoTypes[ext || ''] || 'video/mp4';
  }
}

export const s3Service = new S3Service();

export const upload = {
  initialize: (config: S3Config) => s3Service.initialize(config),
  
  file: (file: Buffer | Uint8Array | string, options?: UploadOptions) => 
    s3Service.upload(file, options),
  
  image: (file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions) =>
    s3Service.uploadImage(file, filename, options),
  
  video: (file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions) =>
    s3Service.uploadVideo(file, filename, options),
  
  delete: (key: string) => s3Service.delete(key),
  getSignedUrl: (key: string, options?: SignedUrlOptions) => s3Service.getSignedUrl(key, options),
  getPublicUrl: (key: string) => s3Service.getPublicUrl(key),
  listFiles: (prefix?: string, maxKeys?: number) => s3Service.listFiles(prefix, maxKeys),
};

export default upload;
