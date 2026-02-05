# Educational Greenhouse: Quick Reference Card

## 📱 Mobile Developer Quick Start

### The Goal
Add dynamic stats to Educational Greenhouse using real Sanity CMS content with points, popularity, and difficulty.

### What's Ready
✅ Sanity schema with educational fields  
✅ API endpoints returning all data  
✅ Complete integration guide  
✅ Working code examples  
✅ Validation test script  

### 5-Minute Setup

#### 1️⃣ Update Your Type (2 min)
```typescript
interface CMSArticle {
  // ... existing fields ...
  points?: number;           // 10 default
  viewCount?: number;        // 0 default
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedCompletionTime?: number; // minutes
}
```

#### 2️⃣ Fetch Articles (already working)
```typescript
const response = await fetch('http://localhost:8080/mobile/sanity/articles');
const { articles } = await response.json();
// articles now include: points, viewCount, difficulty, estimatedCompletionTime
```

#### 3️⃣ Calculate Stats (2 min)
```typescript
const totalPoints = articles?.reduce((sum, a) => sum + (a.points || 10), 0) || 0;
const userProgress = (completedArticles.length / articles.length) * 100;
const popularArticles = articles?.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)) || [];
```

#### 4️⃣ Display in UI (1 min)
```typescript
<Text>{totalPoints} Points Available</Text>
<Text>{userProgress}% Progress</Text>
<FlatList data={popularArticles} renderItem={({item}) => (
  <Text>{item.title} ({item.viewCount} views)</Text>
)} />
```

### API Endpoints

| Endpoint | Method | Returns | Purpose |
|----------|--------|---------|---------|
| `/mobile/sanity/articles` | GET | Articles array | List all articles with all fields |
| `/mobile/sanity/articles/:slug` | GET | Single article | Get full article with all fields |
| `/mobile/sanity/articles/:slug/view` | POST | Success status | Track when user views article |

### Response Structure
```json
{
  "articles": [
    {
      "_id": "...",
      "title": "Learn React",
      "slug": "learn-react",
      "excerpt": "...",
      "points": 15,
      "viewCount": 247,
      "difficulty": "intermediate",
      "estimatedCompletionTime": 8,
      "category": {"name": "Programming", "slug": "programming"},
      "author": {"name": "Jane Doe", "image": "..."},
      "publishedAt": "2024-01-15T...",
      "tags": ["react", "javascript"],
      "readingTime": "8 min",
      "image": "...",
      "published": true
    }
    // ... more articles ...
  ]
}
```

### Field Legend

| Field | Type | Range | Usage |
|-------|------|-------|-------|
| `points` | number | 0-500 | Gamification - use in totalPoints |
| `viewCount` | number | 0+ | Popularity - sort articles by this |
| `difficulty` | string | beginner, intermediate, advanced | Filtering - show appropriate level |
| `estimatedCompletionTime` | number | minutes | UX - show reading time |

### Common Calculations

```typescript
// Total Points in System
const totalPoints = articles.reduce((sum, a) => sum + (a.points || 10), 0);

// Earned Points by User
const earnedPoints = completedArticles.reduce((sum, slug) => {
  const article = articles.find(a => a.slug === slug);
  return sum + (article?.points || 10);
}, 0);

// Progress Percentage
const progress = (completedArticles.length / articles.length) * 100;

// Most Popular (Top 5)
const popular = articles.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 5);

// By Difficulty
const beginner = articles.filter(a => a.difficulty === 'beginner');
const intermediate = articles.filter(a => a.difficulty === 'intermediate');
const advanced = articles.filter(a => a.difficulty === 'advanced');

// Average Reading Time
const avgTime = articles.reduce((sum, a) => sum + (a.estimatedCompletionTime || 5), 0) / articles.length;
```

### Test Command
```bash
# Verify everything works
bash scripts/test-educational-greenhouse.sh

# Should see: ✅ All tests passed!
```

### Manual Test
```typescript
// Quick test in your app
fetch('http://localhost:8080/mobile/sanity/articles')
  .then(r => r.json())
  .then(data => {
    console.log('Total articles:', data.articles.length);
    console.log('First article:', data.articles[0]);
    console.log('Points:', data.articles[0].points);
    console.log('ViewCount:', data.articles[0].viewCount);
    console.log('Difficulty:', data.articles[0].difficulty);
  });
```

### View Tracking (Optional)
```typescript
// Call when user opens an article
const trackView = async (slug: string) => {
  await fetch(`http://localhost:8080/mobile/sanity/articles/${slug}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'user-123' })
  });
};
```

### Sanity Studio Field Location
**Path**: Articles → Educational Tab  
- **Learning Points**: 0-500, default 10
- **View Count**: Read-only, starts at 0
- **Difficulty Level**: Select beginner/intermediate/advanced
- **Estimated Completion Time**: Minutes (1+)

### Defaults (if not set in Sanity)
- `points`: 10
- `viewCount`: 0
- `difficulty`: undefined (no filtering)
- `estimatedCompletionTime`: 5 (fallback)

### Complete Example Screen
```typescript
import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';

export const EducationalGreenhouseScreen = () => {
  const [articles, setArticles] = React.useState<CMSArticle[]>([]);
  const [completedSlugs, setCompletedSlugs] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    fetch('http://localhost:8080/mobile/sanity/articles')
      .then(r => r.json())
      .then(data => setArticles(data.articles));
  }, []);

  // Calculate stats
  const totalLessons = articles.length;
  const totalPoints = articles.reduce((sum, a) => sum + (a.points || 10), 0);
  const earnedPoints = articles
    .filter(a => completedSlugs.has(a.slug))
    .reduce((sum, a) => sum + (a.points || 10), 0);
  const progress = totalLessons ? (completedSlugs.size / totalLessons * 100).toFixed(0) : 0;

  const popularArticles = articles
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5);

  return (
    <ScrollView>
      {/* Hero Stats */}
      <View style={{ padding: 20, backgroundColor: '#f5f5f5' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Learning Journey</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          <View style={{ flex: 1, padding: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{totalLessons}</Text>
            <Text>Total Lessons</Text>
          </View>
          <View style={{ flex: 1, padding: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{totalPoints}</Text>
            <Text>Points Available</Text>
          </View>
          <View style={{ flex: 1, padding: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{earnedPoints}</Text>
            <Text>Points Earned</Text>
          </View>
          <View style={{ flex: 1, padding: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{progress}%</Text>
            <Text>Progress</Text>
          </View>
        </View>
      </View>

      {/* Popular Articles */}
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Popular Articles</Text>
        <FlatList
          data={popularArticles}
          keyExtractor={a => a.slug}
          renderItem={({ item }) => (
            <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>
                {item.viewCount || 0} views • {item.points || 10} pts • {item.estimatedCompletionTime || 5} min
              </Text>
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
};
```

### Checklist
- [ ] Update CMSArticle type with new fields
- [ ] Verify useArticles calls `/mobile/sanity/articles`
- [ ] Update Educational Greenhouse screen to use dynamic data
- [ ] Add view tracking (optional)
- [ ] Run test script: `bash scripts/test-educational-greenhouse.sh`
- [ ] Verify display shows:
  - [ ] Dynamic totalPoints
  - [ ] Dynamic totalLessons
  - [ ] Dynamic userProgress
  - [ ] Popular articles (sorted by viewCount)
  - [ ] Estimated completion times

### Troubleshooting

| Problem | Solution |
|---------|----------|
| API returns empty articles | Check Sanity has published articles, dataset is `nimbus_demo` |
| Fields are null | Verify articles have these fields set in Sanity Studio |
| viewCount is always 0 | Normal! Starts at 0, increments when users view |
| Points always 10 | Set Learning Points field in Sanity for each article |
| Can't find Educational tab | Schema needs updating - check commit b8b7910 |
| Test script fails | Run `curl http://localhost:8080/mobile/sanity/articles` to verify API |

### Documentation
- **Full Schema Guide**: `docs/EDUCATIONAL_GREENHOUSE_SCHEMA_GUIDE.md`
- **Mobile Integration**: `docs/MOBILE_EDUCATIONAL_GREENHOUSE_INTEGRATION.md`
- **Implementation Summary**: `EDUCATIONAL_GREENHOUSE_IMPLEMENTATION.md`
- **API Reference**: `docs/MOBILE_SANITY_API.md`

### Need Help?
1. Read: `docs/MOBILE_EDUCATIONAL_GREENHOUSE_INTEGRATION.md` (has step-by-step guide)
2. Check: `EDUCATIONAL_GREENHOUSE_IMPLEMENTATION.md` (has FAQ)
3. Test: `bash scripts/test-educational-greenhouse.sh`
4. Ask: Look in troubleshooting section above

---

**Time to Integrate**: 30 minutes  
**Status**: ✅ Ready  
**All APIs**: ✅ Working  
**Documentation**: ✅ Complete  
