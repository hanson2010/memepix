## Purpose

Use Google Gemini AI to analyze uploaded images for Chinese-English translations and auto-generate descriptions.

## Requirements

### Requirement: System analyzes uploaded images for Chinese-English translations
The system SHALL use Google Gemini to analyze uploaded images and detect improper Chinese-to-English translations.

#### Scenario: Translation detected
- **WHEN** an uploaded image contains Chinese and English text
- **THEN** system identifies and extracts the translation content

#### Scenario: No translation found
- **WHEN** an uploaded image does not contain Chinese-English translation
- **THEN** system returns empty translation analysis

#### Scenario: Analysis timeout
- **WHEN** Gemini analysis takes longer than 30 seconds
- **THEN** system proceeds without AI suggestions and allows manual entry

### Requirement: System auto-generates description from analysis
The system SHALL generate an initial description based on the detected translation content.

#### Scenario: Successful description generation
- **WHEN** Gemini identifies improper translations
- **THEN** system generates a description summarizing the translation humor

#### Scenario: User modifies generated description
- **WHEN** the AI-generated description is displayed and user edits it
- **THEN** system uses the user's edited description instead

### Requirement: System displays analysis results to user
The system SHALL show the AI-generated description to the user for review before final submission.

#### Scenario: Show AI suggestion
- **WHEN** image analysis completes
- **THEN** system displays the suggested description in an editable field

#### Scenario: Analysis in progress
- **WHEN** image is uploaded but analysis is not complete
- **THEN** system shows a loading indicator

#### Scenario: Analysis fails
- **WHEN** Gemini API returns an error
- **THEN** system displays an empty description field with option to manually enter

### Requirement: System handles Gemini API errors gracefully
The system SHALL allow manual metadata entry when AI analysis fails.

#### Scenario: API unavailable
- **WHEN** Gemini API is unreachable
- **THEN** system allows user to manually enter all metadata

#### Scenario: Rate limit exceeded
- **WHEN** Gemini API returns a rate limit error
- **THEN** system queues the request and retries, or allows manual entry
