## Why

Users are experiencing "NetworkError when attempting to fetch resource" when uploading pictures. This is a CORS (Cross-Origin Resource Sharing) issue with the Cloudflare R2 bucket. The presigned URL approach requires the R2 bucket to allow PUT requests from the application's origin, but CORS headers are not properly configured.

Additionally, uploaded pictures vary in size and format, leading to inconsistent storage costs and user experience. Normalizing images before upload will reduce file sizes and ensure consistency.

## What Changes

- Add client-side image normalization: convert to PNG format before upload
- Compress images larger than 2MB to reduce file size
- Set maximum dimensions (e.g., 1920x1920) for oversized images
- Calculate SHA-256 hash of image to detect and prevent duplicate uploads
- Use hash as filename in R2 storage (YYYY/MM/<hash>.png)
- Add server-side proxy endpoint for R2 uploads as fallback when CORS fails
- Implement enhanced error detection and reporting for CORS-related failures
- Add client-side retry logic with proxy fallback
- Update documentation with explicit CORS configuration instructions
- Add health check endpoint to verify R2 connectivity

## Capabilities

### Modified Capabilities

- `meme-upload`: Extend upload flow to handle CORS failures gracefully with server-side proxy fallback

### New Capabilities

(None - this is a refinement of existing capability)

## Impact

**Affected Systems:**
- `src/app/api/upload/route.ts` - Update to use MD5 hash as filename, add proxy endpoint
- `src/components/UploadForm.tsx` - Add error detection and fallback logic
- `src/lib/image-utils.ts` - New: client-side image normalization (PNG conversion, resizing, compression)
- `src/lib/hash-utils.ts` - New: SHA-256 hash calculation for filename generation
- `openspec/specs/meme-upload/spec.md` - Update with CORS handling scenarios

**Dependencies:**
- Existing R2 bucket configuration
- Server-side S3 client (already in use)
- Canvas API (browser native) for client-side image processing
- Web Crypto API (browser native) for MD5 hash calculation

**Affected Teams:**
- Backend team (proxy endpoint implementation)
- Frontend team (image normalization, error handling and fallback UI)

## Rollback Plan

1. The changes are additive - no breaking changes to existing upload flow
2. If image normalization causes issues, bypass the normalization step
3. If proxy endpoint causes issues, remove the fallback logic from UploadForm.tsx
4. Revert to original presigned URL only approach via git rollback
