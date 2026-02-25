## Purpose

Refine the upload flow to handle CORS failures gracefully, normalize images for consistent storage, prevent duplicates via hash-based deduplication, and establish fixed categories with intelligent defaults.

## Requirements

### Requirement: CORS fallback for R2 uploads
The system SHALL gracefully handle CORS failures when uploading to R2 via presigned URLs by falling back to a server-side proxy.

#### Scenario: Presigned URL upload succeeds
- **WHEN** client uploads image via presigned URL and R2 CORS is properly configured
- **THEN** image is stored directly in R2 bucket

#### Scenario: Presigned URL upload fails due to CORS
- **WHEN** client upload via presigned URL fails with CORS error
- **THEN** system automatically retries upload via server-side proxy endpoint `/api/upload-proxy`

#### Scenario: Proxy fallback succeeds
- **WHEN** server-side proxy receives the image data
- **THEN** proxy uploads to R2 and returns the stored image URL

### Requirement: Image normalization
The system SHALL normalize uploaded images to ensure consistent format and size before storage.

#### Scenario: Convert to PNG format
- **WHEN** user uploads an image in any supported format (JPEG, PNG, GIF, WebP)
- **THEN** system converts the image to PNG format before upload

#### Scenario: Resize oversized images
- **WHEN** uploaded image dimensions exceed 1920x1920 pixels
- **THEN** system resizes the image proportionally to fit within 1920x1920

#### Scenario: Compress large files
- **WHEN** normalized image file size exceeds 2MB
- **THEN** system applies compression to reduce file size below 2MB

### Requirement: Hash-based deduplication
The system SHALL use SHA-256 hash of normalized image for filename generation and duplicate detection.

#### Scenario: Generate hash-based filename
- **WHEN** image is normalized
- **THEN** system calculates SHA-256 hash and uses first 16 characters as filename

#### Scenario: Store with date path
- **WHEN** image is stored in R2
- **THEN** filename follows format `YYYY/MM/<hash>.png`

#### Scenario: Duplicate upload detection
- **WHEN** user uploads an image with identical content to existing image
- **THEN** system stores at same path (deduplication via hash)

### Requirement: Fixed categories
The system SHALL provide a fixed set of categories for meme classification.

#### Scenario: Category selection
- **WHEN** user views category dropdown
- **THEN** system displays exactly these categories:
  - "Machine Translation Fails"
  - "City Skyline"
  - "Natural Landscape"
  - "Life Style"
  - "Others"

#### Scenario: Category ID format
- **WHEN** category is stored
- **THEN** category ID uses kebab-case format (e.g., `machine-translation-fails`, `city-skyline`)

### Requirement: Default category based on AI analysis
The system SHALL set default category based on Gemini's `hasTranslation` flag.

#### Scenario: Translation detected - Machine Translation Fails
- **WHEN** Gemini analysis returns `hasTranslation: true`
- **THEN** system defaults category to "Machine Translation Fails"

#### Scenario: No translation detected - Others
- **WHEN** Gemini analysis returns `hasTranslation: false` or undefined
- **THEN** system defaults category to "Others"

#### Scenario: User can override default
- **WHEN** default category is set by system
- **THEN** user can still select a different category before saving
