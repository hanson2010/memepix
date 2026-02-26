## ADDED Requirements

### Requirement: Display tag cloud on tags page
The system SHALL display a tag cloud on the `/tags` page showing all tags as clickable elements, with font size proportional to the number of memes containing each tag.

#### Scenario: User visits tags page
- **WHEN** user navigates to `/tags`
- **THEN** system displays a cloud of all tags
- **AND** each tag shows its name and meme count
- **AND** tags are styled with size based on meme count

#### Scenario: User clicks a tag
- **WHEN** user clicks on a tag in the tag cloud
- **THEN** system navigates to `/tags/[tagName]`
- **AND** displays memes containing that tag

### Requirement: Limit displayed tags
The system SHALL limit the tag cloud to the top 50 tags by meme count to ensure performance.

#### Scenario: Many tags exist
- **WHEN** there are more than 50 unique tags
- **THEN** system displays only the top 50 tags by meme count
- **AND** tags are sorted by meme count descending
