## 1. Image Normalization

- [x] 1.1 Create `src/lib/hash-utils.ts` for SHA-256 hash calculation
- [x] 1.2 Create `src/lib/image-utils.ts` for image normalization (PNG conversion, resizing, compression)
- [x] 1.3 Set maximum dimensions (1920x1920) for oversized images
- [x] 1.4 Compress images larger than 2MB

## 2. Upload Flow Updates

- [x] 2.1 Update `/api/upload` to accept hash and use as filename
- [x] 2.2 Use filename format `YYYY/MM/<hash>.png`
- [x] 2.3 Update UploadForm component to normalize image before upload
- [x] 2.4 Calculate SHA-256 hash of normalized image

## 3. CORS Fallback

- [x] 3.1 Create `/api/upload-proxy` endpoint for server-side R2 upload
- [x] 3.2 Implement client-side CORS error detection
- [x] 3.3 Add fallback to proxy endpoint when CORS fails

## 4. Testing

- [x] 4.1 Write unit tests for hash-utils.ts
- [x] 4.2 Write unit tests for image-utils.ts
- [x] 4.3 Write integration tests for upload-proxy endpoint
- [x] 4.4 Test upload flow with CORS fallback
