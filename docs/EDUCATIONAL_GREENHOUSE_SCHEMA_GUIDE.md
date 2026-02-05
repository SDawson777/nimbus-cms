# Educational Greenhouse Schema Guide

## Overview

The Sanity article schema has been enhanced to support the Educational Greenhouse feature in the mobile app. This guide explains the new fields and how to use them.

## New Educational Fields

### 1. **Points** (number)
- **Type**: Number
- **Default**: 10 points
- **Range**: 0-500
- **Purpose**: Awards points to users for completing/reading articles
- **Used In**: 
  - `totalPoints` calculation in hero stats
  - User achievement/gamification system
- **How to Set**:
  ```
  In Sanity Studio → Articles → Educational Tab → Learning Points
  ```
- **Example Values**:
  - 5 points: Quick tips/short reads
  - 10 points: Standard articles (default)
  - 25 points: Long-form guides
  - 50 points: Comprehensive courses

### 2. **View Count** (number, read-only)
- **Type**: Number (automatic)
- **Default**: 0 (starts at 0)
- **Purpose**: Tracks how many times users have viewed the article
- **Used In**:
  - Sorting featured articles by popularity
  - Analytics/engagement metrics
  - `popularArticles` ranking in Educational Greenhouse
- **How It Works**:
  - **NOT manually edited** - automatically tracked server-side
  - Incremented via `/mobile/sanity/articles/:slug/view` endpoint
  - Read-only in Sanity Studio
- **Example Usage**:
  ```typescript
  // In mobile app
  const popularArticles = articles?.sort((a, b) => 
    (b.viewCount || 0) - (a.viewCount || 0)
  ) || [];
  ```

### 3. **Difficulty** (string, optional)
- **Type**: Single select
- **Options**: 
  - Beginner
  - Intermediate
  - Advanced
- **Purpose**: Content complexity level for filtering/recommendations
- **Used In**: Filtering articles by skill level
- **How to Set**:
  ```
  In Sanity Studio → Articles → Educational Tab → Difficulty Level
  ```

### 4. **Estimated Completion Time** (number, optional)
- **Type**: Number (minutes)
- **Minimum**: 1 minute
- **Purpose**: Shows users how long an article takes to read/complete
- **Used In**: Setting expectations, progress tracking
- **How to Set**:
  ```
  In Sanity Studio → Articles → Educational Tab → Estimated Completion Time
  ```
- **Example Values**:
  - 3 minutes: Quick tips
  - 7 minutes: Standard article
  - 15 minutes: In-depth guide
  - 30+ minutes: Comprehensive course

## Schema Organization

Articles are now organized into **4 logical groups** in Sanity Studio:

### Content Group (default)
- Title
- Slug
- Excerpt (brief preview text)
- Body (rich text/images)
- Thumbnail Image

### Metadata Group
- Published Date
- Category
- Author
- Reading Time
- Tags

### Educational Group ✨ NEW
- **Learning Points**
- **View Count** (read-only)
- **Difficulty Level**
- **Estimated Completion Time**

### Distribution Group
- Channels (mobile, web, kiosk, email, ads)
- Publishing Schedule
- A/B Variants
- Brand (tenant scoping)
- Store Overrides
- Published status

## Mobile App Integration

### Hero Stats Calculation
```typescript
// Uses points field
const totalLessons = articles?.length || 0;
const totalPoints = articles?.reduce((sum, article) => 
  sum + (article.points || 10), 0
) || 0;
```

### Popular Articles Sorting
```typescript
// Uses viewCount field (automatically incremented)
const popularArticles = articles?.sort((a, b) => 
  (b.viewCount || 0) - (a.viewCount || 0)
) || [];
```

### Progress Tracking
```typescript
// Uses estimatedCompletionTime and points
const calculateProgress = (completedArticles) => {
  const totalTime = articles?.reduce((sum, article) => 
    sum + (article.estimatedCompletionTime || 5), 0
  ) || 0;
  const completedTime = completedArticles?.reduce((sum, article) =>
    sum + (article.estimatedCompletionTime || 5), 0
  ) || 0;
  return (completedTime / totalTime) * 100;
};
```

## API Endpoints

### Fetching Articles with New Fields
```bash
GET /mobile/sanity/articles
```

**Response includes**:
```json
{
  "articles": [
    {
      "_id": "...",
      "title": "...",
      "excerpt": "...",
      "points": 10,
      "viewCount": 23,
      "difficulty": "beginner",
      "estimatedCompletionTime": 7,
      "category": {...},
      "image": "...",
      "author": {...},
      "publishedAt": "2024-01-15T...",
      ...
    }
  ]
}
```

### Tracking Article Views
```bash
POST /mobile/sanity/articles/:slug/view
```

Increments the `viewCount` for the article (server-side tracking).

## Best Practices

### Setting Points
- **Consistent scaling**: Use 5-point increments for consistency
- **Match content length**: 
  - Quick tips: 5 points
  - Standard (5-10 min): 10 points
  - Long articles (10+ min): 15-25 points
  - Comprehensive guides (30+ min): 25-50 points
- **Avoid extremes**: Keep points in 5-50 range for most articles

### Difficulty Levels
- **Beginner**: Articles assuming no prior knowledge
- **Intermediate**: Builds on basic concepts
- **Advanced**: Requires prior context/expertise

### Completion Time
- **Be realistic**: Round up to nearest minute
- **Include variety**: Mix of 3, 5, 7, 10, 15, 20 minute reads
- **Affects progress bar**: Completion time determines user progress percentage

## Existing Fields Still Used

Don't forget these existing fields are still important:

- **excerpt**: Preview text shown in article lists
- **category**: Organizes articles by type
- **mainImage**: Thumbnail for article cards
- **author**: Credit and attribution
- **tags**: For filtering and organization
- **publishedAt**: When article was published

## Frontend Type Definition

The mobile app's CMSArticle type should include:

```typescript
interface CMSArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string; // HTML or rich text
  content: string; // Rendered body
  mainImage?: {
    url: string;
    alt?: string;
  };
  image?: string; // URL string
  publishedAt: string;
  category?: {
    name: string;
    slug: string;
  };
  author?: {
    name: string;
    image?: string;
  };
  readingTime: string;
  tags: string[];
  
  // Educational fields (new)
  points: number; // Default: 10
  viewCount: number; // Default: 0 (read-only)
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedCompletionTime?: number; // in minutes
  
  // Distribution
  channels: string[];
  published: boolean;
}
```

## Troubleshooting

### Articles showing 0 points
- **Issue**: New articles use the default value (10)
- **Fix**: Set the `points` field explicitly in Sanity Studio

### View count not updating
- **Issue**: Mobile app isn't calling the view tracking endpoint
- **Fix**: Ensure `POST /mobile/sanity/articles/:slug/view` is called when user opens article
- **Verify**: Check API logs at `/tmp/nimbus-server-e2e.log`

### Missing completion time
- **Issue**: Estimated time not set
- **Impact**: Progress calculation uses 5-minute default
- **Fix**: Set `estimatedCompletionTime` for all articles

### Difficulty not showing
- **Issue**: Field is optional, articles may not have a value
- **Fix**: Set difficulty for articles that need filtering
- **Default behavior**: Articles without difficulty aren't filtered

## Testing

### Manual Testing in Sanity Studio
1. Open any article
2. Click "Educational" tab
3. Verify you can see:
   - Learning Points field (with default 10)
   - View Count field (read-only, shows 0 for new articles)
   - Difficulty Level dropdown
   - Estimated Completion Time field

### API Testing
```bash
# Test article fetch with new fields
curl -s "http://localhost:8080/mobile/sanity/articles" | jq '.articles[0] | {points, viewCount, difficulty, estimatedCompletionTime}'

# Should return something like:
# {
#   "points": 10,
#   "viewCount": 23,
#   "difficulty": "beginner",
#   "estimatedCompletionTime": 7
# }
```

### Mobile App Testing
1. Verify hero stats show correct totals
2. Check popular articles are sorted by viewCount
3. Verify progress bar updates correctly
4. Test article completion and point tracking

## Summary

✅ **Points**: Gamification rewards  
✅ **ViewCount**: Popularity tracking  
✅ **Difficulty**: Content filtering  
✅ **Completion Time**: Progress tracking  

All fields are now ready to support the Educational Greenhouse feature in the mobile app!
