## Context

Users currently can only browse memes by category or search. Adding a tag cloud will improve content discovery by allowing users to browse memes by tags.

## Goals / Non-Goals

**Goals:**
- Add "Tags" navigation button between Browse and Upload
- Create `/tags` page displaying all tags as a cloud (sized by meme count)
- Create `/tags/[tag]` page showing memes filtered by selected tag
- Add autocomplete dropdown when user types in tags input during upload

**Non-Goals:**
- Tag management (creating/editing tags) - out of scope

## Decisions

1. **Firestore query for tags**: Aggregate tags by querying all memes and counting tag occurrences client-side. Alternative: maintain a separate `tags` collection. Chosen: client-side aggregation for simplicity since meme count is manageable.

2. **Tag cloud sizing**: Size tags by font-size based on meme count (min/max range). Chosen: simple linear scale between min and max font sizes.

3. **Navigation**: Add Tags button in header alongside Browse and Upload. Chosen: inline button to keep navigation simple.

4. **Tag filtering**: Reuse existing `listMemes` API with `tags` filter. Chosen: leverage existing infrastructure.

5. **Tag autocomplete**: Show dropdown with matching tags as user types. Chosen: use existing `listMemes` to get all tags, filter client-side for autocomplete suggestions. Trigger after 2 characters, show top 10 matches.

6. **Autocomplete API**: Create `/api/tags` endpoint that returns all unique tags from memes collection. Chosen: simple endpoint returning tag list for client-side filtering.

## Risks / Trade-offs

- [Risk] Large number of tags → Mitigation: Limit display to top N tags (e.g., 50) by meme count
- [Risk] Slow tag aggregation with many memes → Mitigation: Add caching or server-side aggregation if needed
- [Risk] Autocomplete API called too frequently → Mitigation: Debounce API calls (300ms)
