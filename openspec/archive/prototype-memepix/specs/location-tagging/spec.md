## ADDED Requirements

### Requirement: System extracts geographical information from images
The system SHALL use Google Gemini to identify geographical indicators in uploaded images (signs, landmarks, text references).

#### Scenario: Location detected
- **WHEN** an uploaded image contains geographical indicators
- **THEN** system extracts the location name

#### Scenario: No location detected
- **WHEN** an uploaded image contains no geographical indicators
- **THEN** system returns no location tag

### Requirement: System creates lowercase English location tags
The system SHALL convert extracted location names to lowercase English tags.

#### Scenario: Chinese location name
- **WHEN** detected location is in Chinese (e.g., 北京)
- **THEN** system translates to lowercase English "beijing"

#### Scenario: Mixed language location
- **WHEN** detected location is mixed or non-English
- **THEN** system transliterates to lowercase English

#### Scenario: Already English location
- **WHEN** detected location is already in English
- **THEN** system converts to lowercase

### Requirement: System suggests location tag to user
The system SHALL display the detected location tag as a suggestion that the user can accept, modify, or reject.

#### Scenario: Accept location tag
- **WHEN** system suggests a location tag and user clicks accept
- **THEN** system adds the tag to the meme

#### Scenario: Reject location tag
- **WHEN** system suggests a location tag and user clicks reject
- **THEN** system removes the suggested tag

#### Scenario: Edit location tag
- **WHEN** user modifies the suggested location tag text
- **THEN** system uses the edited tag instead

### Requirement: System handles ambiguous locations
The system SHALL handle cases where location is unclear or multiple locations are detected.

#### Scenario: Multiple locations detected
- **WHEN** image contains references to multiple locations
- **THEN** system suggests the most prominent one or lists all as options

#### Scenario: Ambiguous location
- **WHEN** detected location is ambiguous
- **THEN** system allows user to manually specify the location
