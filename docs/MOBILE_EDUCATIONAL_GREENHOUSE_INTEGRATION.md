# Mobile App: Educational Greenhouse Integration Guide

## Quick Start (5 minutes)

This guide shows mobile devs exactly what needs to happen to use the new educational fields in the Educational Greenhouse feature.

## What Changed

✅ **Sanity Schema**: Article schema now has educational fields:
- `points` (number) - gamification/rewards
- `viewCount` (number) - popularity tracking
- `difficulty` (string) - content complexity
- `estimatedCompletionTime` (number) - reading duration

✅ **API Endpoints**: Mobile endpoints now return these fields:
- `GET /mobile/sanity/articles` - list with all fields
- `GET /mobile/sanity/articles/:slug` - single article with all fields
- `POST /mobile/sanity/articles/:slug/view` - track views

✅ **Documentation**: Complete guides available:
- `EDUCATIONAL_GREENHOUSE_SCHEMA_GUIDE.md` - field details
- `test-educational-greenhouse.sh` - validation script

## Integration Steps

### Step 1: Update Article Type (if needed)

Ensure your `CMSArticle` type includes the new fields:

```typescript
// src/types/cms.ts
export interface CMSArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body?: string;
  content?: string;
  mainImage?: {
    url: string;
    alt?: string;
  };
  image?: string;
  publishedAt: string;
  category?: {
    name: string;
    slug: string;
  };
  author?: {
    name: string;
    image?: string;
  };
  readingTime?: string;
  tags?: string[];
  
  // ✨ NEW EDUCATIONAL FIELDS
  points?: number;           // Default: 10
  viewCount?: number;        // Default: 0
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedCompletionTime?: number; // minutes
  
  channels?: string[];
  published?: boolean;
}
```

### Step 2: Update useArticles Hook

If you have a `useArticles` hook, it should already return the new fields from the API. Just ensure it's calling the right endpoint:

```typescript
// src/hooks/useArticles.ts
import { useState, useEffect } from 'react';
import type { CMSArticle } from '../types/cms';

export const useArticles = () => {
  const [articles, setArticles] = useState<CMSArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        // ✅ New endpoint returns all fields including educational ones
        const response = await fetch('http://localhost:8080/mobile/sanity/articles');
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return { articles, loading };
};
```

### Step 3: Update Educational Greenhouse Screen

Use the new fields to calculate dynamic stats:

```typescript
// src/screens/EducationalGreenhouseScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useArticles } from '../hooks/useArticles';
import { useArticleProgress } from '../hooks/useArticleProgress';

export const EducationalGreenhouseScreen = () => {
  const { articles } = useArticles();
  const { completedArticles } = useArticleProgress();

  // ✨ Calculate stats using new fields
  const totalLessons = articles?.length || 0;
  
  const totalPoints = articles?.reduce((sum, article) => 
    sum + (article.points || 10), 0
  ) || 0;

  const completedPoints = completedArticles?.reduce((sum, slug) => {
    const article = articles?.find(a => a.slug === slug);
    return sum + (article?.points || 10);
  }, 0) || 0;

  const userProgress = totalLessons > 0 
    ? Math.round((completedArticles.length / totalLessons) * 100)
    : 0;

  // ✨ Sort by viewCount to show popular articles
  const popularArticles = articles
    ?.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5) || [];

  // ✨ Filter by difficulty if needed
  const beginnerArticles = articles
    ?.filter(a => a.difficulty === 'beginner') || [];

  return (
    <ScrollView>
      {/* Hero Stats - using new fields */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Your Learning Journey</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalLessons}</Text>
            <Text style={styles.statLabel}>Total Lessons</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalPoints}</Text>
            <Text style={styles.statLabel}>Points Available</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{completedPoints}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{userProgress}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>
      </View>

      {/* Featured/Popular Articles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Articles</Text>
        {popularArticles.map(article => (
          <ArticleCard
            key={article.slug}
            article={article}
            onPress={() => navigateToArticle(article.slug)}
          />
        ))}
      </View>

      {/* Learning by Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beginner Friendly</Text>
        {beginnerArticles.map(article => (
          <ArticleCard
            key={article.slug}
            article={article}
            difficulty="beginner"
          />
        ))}
      </View>
    </ScrollView>
  );
};

// Helper component for article cards
const ArticleCard = ({ article, onPress, difficulty }) => (
  <View style={styles.card} onPress={onPress}>
    <Text style={styles.title}>{article.title}</Text>
    <Text style={styles.excerpt}>{article.excerpt}</Text>
    
    {/* Display educational metadata */}
    <View style={styles.metadata}>
      <Text>📚 {article.points || 10} pts</Text>
      <Text>👁️ {article.viewCount || 0} views</Text>
      {article.estimatedCompletionTime && (
        <Text>⏱️ {article.estimatedCompletionTime} min</Text>
      )}
      {article.difficulty && (
        <Text>🎯 {article.difficulty}</Text>
      )}
    </View>
  </View>
);
```

### Step 4: Track Article Views (Optional)

When users open/read an article, track the view:

```typescript
// src/screens/ArticleDetailScreen.tsx
import React, { useEffect } from 'react';
import { useRoute } from '@react-navigation/native';

export const ArticleDetailScreen = () => {
  const route = useRoute();
  const { slug } = route.params;

  useEffect(() => {
    // Track that user viewed this article
    trackArticleView(slug);
  }, [slug]);

  return (
    // Article content...
  );
};

const trackArticleView = async (slug: string) => {
  try {
    // ✅ Call the view tracking endpoint
    await fetch(`http://localhost:8080/mobile/sanity/articles/${slug}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user-id-here' })
    });
  } catch (error) {
    console.error('Failed to track view:', error);
    // Not critical - continue anyway
  }
};
```

### Step 5: Test Everything

Run the validation script to verify all fields are working:

```bash
# From repo root
bash scripts/test-educational-greenhouse.sh

# You should see:
# ✅ All tests passed!
# ✓ Response has articles array
# ✓ Article 1 has field '_id'
# ✓ Article 1 has field 'points'
# ✓ Article 1 has field 'viewCount'
# ... etc
```

## Complete Example: Educational Greenhouse Stats

Here's a complete working example showing all calculations:

```typescript
import React, { useMemo } from 'react';
import { useArticles } from '../hooks/useArticles';
import { useArticleProgress } from '../hooks/useArticleProgress';

export const EducationalGreenhouseStats = () => {
  const { articles } = useArticles();
  const { completedArticles } = useArticleProgress();

  // Memoized calculations using new fields
  const stats = useMemo(() => {
    if (!articles || articles.length === 0) {
      return {
        totalLessons: 0,
        totalPoints: 0,
        earnedPoints: 0,
        progressPercent: 0,
        mostDifficult: [],
        easiest: [],
        mostPopular: [],
        averageReadTime: 0,
      };
    }

    // Total lessons available
    const totalLessons = articles.length;

    // Total points in system
    const totalPoints = articles.reduce((sum, article) => {
      return sum + (article.points || 10);
    }, 0);

    // Points earned by user
    const earnedPoints = completedArticles.reduce((sum, slug) => {
      const article = articles.find(a => a.slug === slug);
      return sum + (article?.points || 10);
    }, 0);

    // Progress percentage
    const progressPercent = totalLessons > 0
      ? Math.round((completedArticles.length / totalLessons) * 100)
      : 0;

    // Articles by difficulty
    const byDifficulty = {
      beginner: articles.filter(a => a.difficulty === 'beginner'),
      intermediate: articles.filter(a => a.difficulty === 'intermediate'),
      advanced: articles.filter(a => a.difficulty === 'advanced'),
    };

    // Most popular (highest viewCount)
    const mostPopular = articles
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 5);

    // Average reading time
    const avgReadTime = articles.length > 0
      ? Math.round(
          articles.reduce((sum, a) => sum + (a.estimatedCompletionTime || 5), 0)
          / articles.length
        )
      : 0;

    return {
      totalLessons,
      totalPoints,
      earnedPoints,
      progressPercent,
      easiest: byDifficulty.beginner,
      intermediate: byDifficulty.intermediate,
      hardest: byDifficulty.advanced,
      mostPopular,
      averageReadTime: avgReadTime,
    };
  }, [articles, completedArticles]);

  return (
    <View>
      <Text>Total Lessons: {stats.totalLessons}</Text>
      <Text>Total Points: {stats.totalPoints}</Text>
      <Text>Your Points: {stats.earnedPoints}</Text>
      <Text>Progress: {stats.progressPercent}%</Text>
      <Text>Average Read Time: {stats.averageReadTime} min</Text>
    </View>
  );
};
```

## Field Reference Quick Table

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `points` | number | 10 | Points awarded for completing |
| `viewCount` | number | 0 | Times article has been viewed |
| `difficulty` | string | undefined | beginner/intermediate/advanced |
| `estimatedCompletionTime` | number | undefined | Reading time in minutes |
| `category` | object | undefined | Article category/topic |
| `author` | object | undefined | Author info |
| `publishedAt` | string | - | Publish date |
| `excerpt` | string | - | Preview text |

## Validation Checklist

Before considering this complete, verify:

- [ ] Article type has all new fields in TypeScript interface
- [ ] `useArticles` hook calls `/mobile/sanity/articles` endpoint
- [ ] Educational Greenhouse screen calculates totalPoints correctly
- [ ] Featured articles sort by viewCount (descending)
- [ ] Difficulty level filtering works
- [ ] Completion time displays correctly
- [ ] View tracking calls POST endpoint (optional but recommended)
- [ ] Test script passes with `bash scripts/test-educational-greenhouse.sh`
- [ ] Sanity Studio shows new fields in "Educational" tab when editing articles
- [ ] Mobile app displays dynamic stats instead of hardcoded values

## Troubleshooting

### "viewCount is always 0"
- This is normal! It starts at 0 and increments as users view articles
- Make sure you're calling the POST endpoint to track views
- Check server logs: `grep "article.view" /tmp/nimbus-server-e2e.log`

### "points field is missing"
- Ensure server code includes points in query projection
- Check: `server/src/routes/mobileSanityContent.ts` has `points,` in GROQ query
- Verify article has points set in Sanity Studio

### "Calculations showing NaN"
- Make sure articles array is populated before calculating
- Use optional chaining: `article?.points || 10`
- Check loading state is handled

### "API returns empty articles"
- Verify articles are published in Sanity Studio
- Check dataset is set to `nimbus_demo` (not `nimbus_preview`)
- Ensure API server is running on port 8080
- Test manually: `curl http://localhost:8080/mobile/sanity/articles`

## Next Steps

1. **Update your types** - Add fields to `CMSArticle` interface
2. **Update your hooks** - Ensure `useArticles` fetches new endpoint
3. **Update your screens** - Use fields for calculations
4. **Set Sanity values** - Go to Sanity Studio and fill in points/difficulty for articles
5. **Test** - Run `bash scripts/test-educational-greenhouse.sh`
6. **Deploy** - Commit and push your changes

## Support

For questions about:
- **Schema fields**: See `EDUCATIONAL_GREENHOUSE_SCHEMA_GUIDE.md`
- **API endpoints**: See `MOBILE_SANITY_API.md`
- **Sanity setup**: See `SANITY_PUBLISHING_FIXED.md`
- **Testing**: Run `bash scripts/test-educational-greenhouse.sh`

Everything is documented and ready to use!
