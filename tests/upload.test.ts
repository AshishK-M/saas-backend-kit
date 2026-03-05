describe('Upload Module (S3)', () => {
  test('should have upload functions defined', () => {
    const { upload } = require('../dist/upload');
    
    expect(upload).toBeDefined();
    expect(upload.initialize).toBeDefined();
    expect(upload.file).toBeDefined();
    expect(upload.image).toBeDefined();
    expect(upload.video).toBeDefined();
    expect(upload.delete).toBeDefined();
    expect(upload.getSignedUrl).toBeDefined();
    expect(upload.getPublicUrl).toBeDefined();
  });

  test('should initialize S3 service', () => {
    const { upload } = require('../dist/upload');
    
    expect(() => {
      upload.initialize({
        region: 'us-east-1',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        bucket: 'test-bucket'
      });
    }).not.toThrow();
  });

  test('should have s3Service defined', () => {
    const { s3Service } = require('../dist/upload');
    
    expect(s3Service).toBeDefined();
  });
});
