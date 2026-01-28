# Custom Genre Feature

## Overview
Added the ability for users to add custom genres when uploading tracks or filtering in the explore page.

## Changes Made

### 1. New Component: GenreSelector (`/components/ui/genre-selector.tsx`)
- Reusable component for selecting or adding genres
- Features:
  - Dropdown with predefined genres
  - "Add Genre" button to create custom genres
  - Inline input field for entering custom genre names
  - Keyboard shortcuts:
    - `Enter` to add the genre
    - `Escape` to cancel
  - Visual display of custom genres with ability to remove them
  - Prevents duplicate genres

### 2. Upload Page (`/app/upload/page.tsx`)
- Replaced hardcoded genre dropdowns with `GenreSelector` component
- Works in both Single Upload and Mass Upload modes
- Users can now add any genre they want if it's not in the predefined list

### 3. Explore Page (`/app/explore/page.tsx`)
- Added "+" button in the genre filter section
- Users can add custom genres to filter tracks
- Custom genres appear as filter chips with an X button to remove them
- Clicking a custom genre filters tracks by that genre
- Keyboard shortcuts work the same as in GenreSelector

## User Experience

### Upload Flow:
1. User selects "Genre" field
2. If desired genre is not in the list, click "Add Genre" button
3. Enter custom genre name
4. Press Enter or click "Add" button
5. Custom genre is now available in the dropdown and automatically selected

### Explore Flow:
1. User browses the explore page
2. Clicks the "+" button next to genre filters
3. Types custom genre name
4. Press Enter to add and automatically filter by that genre
5. Custom genre appears as a chip with X button to remove it

## Technical Details

- Custom genres are stored in component state (not persisted)
- Genres are case-sensitive
- Duplicate prevention built-in
- Clean UI with smooth transitions
- Mobile-responsive design

## Benefits

1. **Flexibility**: Users aren't limited to predefined genres
2. **Discovery**: Users can create niche genres for better categorization
3. **User Control**: Easy to add and remove custom genres
4. **Consistency**: Same component used across upload and explore pages
