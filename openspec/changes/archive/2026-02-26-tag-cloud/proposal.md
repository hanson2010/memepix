## Why

Users currently have no way to discover memes by tags. Adding a tag cloud enables browsing memes by topic, improving content discovery and user engagement.

## What Changes

- Add "Tags" navigation button between Browse and Upload
- Create new `/tags` page with tag cloud display
- Create new `/tags/[tag]` page showing memes filtered by selected tag
- Query Firestore for tags and memes with specific tag
- Add autocomplete dropdown when user types in tags input field during upload

## Capabilities

### New Capabilities
- **tag-cloud**: Display all tags as a cloud (sized by meme count), clickable to filter
- **tag-filtered-list**: Show memes filtered by a selected tag
- **tag-autocomplete**: Show autocomplete suggestions when user types tags during upload

### Modified Capabilities
- None (existing capabilities unchanged)

## Impact

- New route: `/tags` and `/tags/[tag]`
- New UI components: TagCloud, TagBadge
- Firestore query: fetch memes where tags array contains the tag
- Navigation: add Tags button to header
- New API endpoint: GET `/api/tags` for autocomplete suggestions
- Modify TagInput component to show autocomplete dropdown
