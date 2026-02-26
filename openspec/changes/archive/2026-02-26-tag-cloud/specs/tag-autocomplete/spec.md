## ADDED Requirements

### Requirement: Show autocomplete suggestions while typing tags
The system SHALL display a dropdown with matching tag suggestions when the user types in the tags input field during upload.

#### Scenario: User types in tags input
- **WHEN** user types at least 2 characters in the tags input field
- **THEN** system displays a dropdown with matching tag suggestions
- **AND** suggestions are filtered by the typed text (case-insensitive)
- **AND** suggestions are limited to 10 items

#### Scenario: User selects a suggestion
- **WHEN** user clicks on a suggestion in the dropdown
- **THEN** system adds the selected tag to the input
- **AND** clears the dropdown
- **AND** focuses back on the input field

#### Scenario: No matching suggestions
- **WHEN** user types but no tags match the input
- **THEN** system does not show the dropdown
- **OR** shows an empty dropdown

#### Scenario: User continues typing
- **WHEN** user continues typing after dropdown is shown
- **THEN** system updates the suggestions to match the new input
- **AND** dropdown remains visible if there are matches
