# Tag Filtered List

## Purpose
Display memes filtered by a selected tag when user visits a tag detail page. (TBD)

## Requirements

### Requirement: Display memes filtered by tag
The system SHALL display memes filtered by a selected tag when user visits `/tags/[tagName]`.

#### Scenario: User visits tag page
- **WHEN** user navigates to `/tags/[tagName]`
- **THEN** system displays a list of memes containing that tag
- **AND** the page shows the tag name as the page title
- **AND** memes are sorted by creation date (newest first)

#### Scenario: Tag has no memes
- **WHEN** user visits a tag page with no memes
- **THEN** system displays a message indicating no memes found
- **AND** provides a link back to the tag cloud

#### Scenario: User navigates back to tag cloud
- **WHEN** user clicks "Back to Tags" or similar
- **THEN** system navigates to `/tags` page
- **AND** displays the full tag cloud
