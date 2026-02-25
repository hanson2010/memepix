## Purpose

Enable users to upload meme images with metadata (description, category, tags) to the platform.

## Requirements

### Requirement: User can upload meme image
The system SHALL allow users to upload image files (JPEG, PNG, GIF, WebP) up to 10MB via a web form.

#### Scenario: Successful image upload
- **WHEN** user selects an image file and clicks upload
- **THEN** system stores the image in R2 and returns a preview

#### Scenario: Invalid file type
- **WHEN** user selects a non-image file
- **THEN** system displays an error message "Please select an image file"

#### Scenario: File too large
- **WHEN** user selects an image larger than 10MB
- **THEN** system displays an error message "Image must be under 10MB"

### Requirement: User can add metadata to meme
The system SHALL allow users to enter a description, select a category, and add multiple tags for each uploaded meme.

#### Scenario: Add description
- **WHEN** user enters text in the description field
- **THEN** system saves the description with the meme

#### Scenario: Select category
- **WHEN** user selects a category from the dropdown
- **THEN** system associates the meme with that category

#### Scenario: Add tags
- **WHEN** user types a tag and presses enter
- **THEN** system adds the tag to the meme's tag list

#### Scenario: Remove tag
- **WHEN** user clicks the X on a tag
- **THEN** system removes that tag from the meme

### Requirement: System persists meme data
The system SHALL store all meme metadata (description, category, tags) in Firestore with timestamps.

#### Scenario: Save meme metadata
- **WHEN** user submits the upload form
- **THEN** system creates a document in Firestore with all metadata and timestamps

#### Scenario: Retrieve meme data
- **WHEN** user requests a meme by ID
- **THEN** system returns the meme document from Firestore

### Requirement: User can edit meme before finalizing
The system SHALL allow users to modify the AI-generated description and metadata before final submission.

#### Scenario: Edit description
- **WHEN** user modifies the AI-suggested description
- **THEN** system updates the description field

#### Scenario: Change category
- **WHEN** user selects a different category
- **THEN** system updates the category selection

#### Scenario: Modify tags
- **WHEN** user adds or removes tags
- **THEN** system updates the tag list
