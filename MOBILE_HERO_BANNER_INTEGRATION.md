# Mobile Home Hero Banner Integration Guide

## Overview

The Nimbus CMS now supports **white-label home hero banner customization** that can be configured via:
1. **Sanity CMS** (content editors)
2. **Admin SPA** (brand managers)

Mobile apps can fetch these settings from the theme API and render a customizable hero banner on the home screen.

---

## API Integration

### Endpoint

**GET** `/api/mobile-sanity-content/theme`

**Query Parameters:**
- `brand` (optional): Brand slug (e.g., `jars`)
- `store` (optional): Store slug (e.g., `downtown`)

**Example Request:**
```bash
curl "https://your-domain.com/api/mobile-sanity-content/theme?brand=jars"
```

**Response Schema:**
```json
{
  "theme": {
    "primaryColor": "#8b5cf6",
    "secondaryColor": "#22c55e",
    "accentColor": "#f59e0b",
    "backgroundColor": "#020617",
    "surfaceColor": "#0f172a",
    "textColor": "#e5e7eb",
    "mutedTextColor": "#9ca3af",
    "logo": "https://cdn.sanity.io/...",
    "typography": {
      "fontFamily": "Inter",
      "fontSize": "16px"
    },
    "darkModeEnabled": false,
    "cornerRadius": "12px",
    "elevationStyle": "medium",
    "screenBorderEnabled": true,
    "screenBorderColor": "#ffffff",
    "screenBorderPattern": "stripes",
    
    // NEW: Hero Banner Fields
    "heroTitle": "Welcome to JARS",
    "heroSubtitle": "Premium cannabis selection",
    "heroBackgroundColor": "#1a1a1a",
    "heroTextColor": "#f5f5f5",
    "heroBackgroundImageUrl": "https://cdn.sanity.io/images/hero.jpg"
  }
}
```

### Alternative: Unified Content Endpoint

For initial app load, use the aggregated endpoint:

**GET** `/api/mobile-sanity-content/all`

This returns all content including theme in a single response:
```json
{
  "theme": { /* same schema as above */ },
  "articles": [...],
  "categories": [...],
  "banners": [...]
}
```

---

## Field Reference

### `heroTitle` (string)
- **Default:** `"Welcome to Nimbus"`
- **Description:** Main heading displayed in the hero banner
- **Usage:** Primary call-to-action or brand message
- **Max length:** Recommended 50 characters for mobile

### `heroSubtitle` (string)
- **Default:** `"Curated cannabis experiences"`
- **Description:** Supporting text displayed below the title
- **Usage:** Tagline, value proposition, or additional context
- **Max length:** Recommended 100 characters for mobile

### `heroBackgroundColor` (string | null)
- **Default:** `null` (falls back to theme backgroundColor)
- **Format:** Hex color code (e.g., `#1a1a1a`, `#020617`)
- **Description:** Background color for hero banner (used if no image)
- **Validation:** Matches `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`

### `heroTextColor` (string | null)
- **Default:** `null` (falls back to theme textColor)
- **Format:** Hex color code (e.g., `#f5f5f5`, `#e5e7eb`)
- **Description:** Text color for hero title and subtitle
- **Usage:** Ensure sufficient contrast with background

### `heroBackgroundImageUrl` (string | null)
- **Default:** `null` (no image, uses solid color)
- **Format:** Absolute URL to image asset
- **Description:** Optional background image for hero banner
- **Priority:** When set, overlays on top of backgroundColor
- **Recommended dimensions:** 1080×600px (9:5 aspect ratio for mobile landscape hero)

---

## Design Specifications

### Recommended Dimensions

**Mobile Portrait (9:16):**
- Container height: 200-300px
- Full width

**Mobile Landscape:**
- Container height: 400-500px
- Full width

**Background Image:**
- Minimum: 1080×600px
- Recommended: 1920×1080px (high DPI support)
- Aspect ratio: 16:9 or 9:5
- Format: WebP or JPEG (optimized < 200KB)

### Typography Hierarchy

**Hero Title:**
- Font size: 32-40px (mobile)
- Font weight: 700 (bold)
- Line height: 1.2
- Letter spacing: -0.02em (tight)

**Hero Subtitle:**
- Font size: 16-20px (mobile)
- Font weight: 400 (regular)
- Line height: 1.5
- Opacity: 0.8-0.9

### Accessibility

- **Contrast ratio:** Minimum 4.5:1 between text and background
- **Touch target size:** If hero is tappable, minimum 44×44pt
- **Alt text:** Provide semantic description for screen readers
- **Reduced motion:** Disable animations for users with motion preferences

---

## Mobile Implementation Guide

### React Native Example

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HeroBanner {
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundColor: string | null;
  heroTextColor: string | null;
  heroBackgroundImageUrl: string | null;
}

interface ThemeContextValue {
  theme: HeroBanner | null;
}

// 1. Fetch theme on app init
export const useTheme = () => {
  const [theme, setTheme] = useState<HeroBanner | null>(null);

  useEffect(() => {
    fetch('https://your-api.com/api/mobile-sanity-content/theme?brand=jars')
      .then(res => res.json())
      .then(data => {
        if (data.theme) {
          setTheme({
            heroTitle: data.theme.heroTitle ?? 'Welcome to Nimbus',
            heroSubtitle: data.theme.heroSubtitle ?? 'Curated cannabis experiences',
            heroBackgroundColor: data.theme.heroBackgroundColor ?? '#020617',
            heroTextColor: data.theme.heroTextColor ?? '#e5e7eb',
            heroBackgroundImageUrl: data.theme.heroBackgroundImageUrl ?? null,
          });
        }
      })
      .catch(err => console.warn('Failed to load theme', err));
  }, []);

  return theme;
};

// 2. Create Hero Banner component
export const HomeHeroBanner: React.FC = () => {
  const theme = useTheme();
  const { width } = Dimensions.get('window');

  if (!theme) {
    return <View style={styles.placeholder} />;
  }

  const backgroundColor = theme.heroBackgroundColor || '#020617';
  const textColor = theme.heroTextColor || '#e5e7eb';

  const content = (
    <>
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>
          {theme.heroTitle}
        </Text>
        <Text style={[styles.subtitle, { color: textColor }]}>
          {theme.heroSubtitle}
        </Text>
      </View>
    </>
  );

  if (theme.heroBackgroundImageUrl) {
    return (
      <ImageBackground
        source={{ uri: theme.heroBackgroundImageUrl }}
        style={[styles.container, { width }]}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        {content}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor, width }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundImage: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    height: 250,
    backgroundColor: '#020617',
  },
});
```

### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class HeroBannerTheme {
  final String heroTitle;
  final String heroSubtitle;
  final Color heroBackgroundColor;
  final Color heroTextColor;
  final String? heroBackgroundImageUrl;

  HeroBannerTheme({
    required this.heroTitle,
    required this.heroSubtitle,
    required this.heroBackgroundColor,
    required this.heroTextColor,
    this.heroBackgroundImageUrl,
  });

  factory HeroBannerTheme.fromJson(Map<String, dynamic> json) {
    return HeroBannerTheme(
      heroTitle: json['heroTitle'] ?? 'Welcome to Nimbus',
      heroSubtitle: json['heroSubtitle'] ?? 'Curated cannabis experiences',
      heroBackgroundColor: _parseColor(json['heroBackgroundColor'], Colors.black),
      heroTextColor: _parseColor(json['heroTextColor'], Colors.white),
      heroBackgroundImageUrl: json['heroBackgroundImageUrl'],
    );
  }

  static Color _parseColor(String? hex, Color fallback) {
    if (hex == null) return fallback;
    try {
      return Color(int.parse(hex.substring(1), radix: 16) + 0xFF000000);
    } catch (e) {
      return fallback;
    }
  }
}

// 1. Fetch theme
class ThemeService {
  static Future<HeroBannerTheme?> fetchTheme(String brand) async {
    try {
      final response = await http.get(
        Uri.parse('https://your-api.com/api/mobile-sanity-content/theme?brand=$brand'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['theme'] != null) {
          return HeroBannerTheme.fromJson(data['theme']);
        }
      }
    } catch (e) {
      print('Failed to load theme: $e');
    }
    return null;
  }
}

// 2. Hero Banner widget
class HomeHeroBanner extends StatelessWidget {
  final HeroBannerTheme? theme;

  const HomeHeroBanner({
    Key? key,
    this.theme,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (theme == null) {
      return Container(
        height: 250,
        color: Colors.black,
      );
    }

    return Container(
      height: 250,
      decoration: BoxDecoration(
        color: theme!.heroBackgroundColor,
        image: theme!.heroBackgroundImageUrl != null
            ? DecorationImage(
                image: NetworkImage(theme!.heroBackgroundImageUrl!),
                fit: BoxFit.cover,
              )
            : null,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: Stack(
        children: [
          // Overlay gradient for text readability
          if (theme!.heroBackgroundImageUrl != null)
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.4),
                    Colors.black.withOpacity(0.7),
                  ],
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(16),
                  bottomRight: Radius.circular(16),
                ),
              ),
            ),
          // Hero content
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    theme!.heroTitle,
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: theme!.heroTextColor,
                      letterSpacing: -0.5,
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.75),
                          offset: Offset(0, 2),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8),
                  Text(
                    theme!.heroSubtitle,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w400,
                      color: theme!.heroTextColor.withOpacity(0.9),
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.75),
                          offset: Offset(0, 1),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// 3. Usage in HomeScreen
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  HeroBannerTheme? _theme;

  @override
  void initState() {
    super.initState();
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final theme = await ThemeService.fetchTheme('jars');
    setState(() {
      _theme = theme;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            HomeHeroBanner(theme: _theme),
            Expanded(
              child: ListView(
                padding: EdgeInsets.all(16),
                children: [
                  // Your home screen content
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### Swift/iOS Example

```swift
import UIKit

struct HeroBannerTheme: Codable {
    let heroTitle: String
    let heroSubtitle: String
    let heroBackgroundColor: String?
    let heroTextColor: String?
    let heroBackgroundImageUrl: String?
    
    enum CodingKeys: String, CodingKey {
        case heroTitle
        case heroSubtitle
        case heroBackgroundColor
        case heroTextColor
        case heroBackgroundImageUrl
    }
}

struct ThemeResponse: Codable {
    let theme: HeroBannerTheme?
}

// 1. Fetch theme
class ThemeService {
    static func fetchTheme(brand: String, completion: @escaping (HeroBannerTheme?) -> Void) {
        guard let url = URL(string: "https://your-api.com/api/mobile-sanity-content/theme?brand=\(brand)") else {
            completion(nil)
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data,
                  let themeResponse = try? JSONDecoder().decode(ThemeResponse.self, from: data) else {
                completion(nil)
                return
            }
            completion(themeResponse.theme)
        }.resume()
    }
}

// 2. Hero Banner View
class HomeHeroBannerView: UIView {
    private let titleLabel = UILabel()
    private let subtitleLabel = UILabel()
    private let backgroundImageView = UIImageView()
    private let overlayView = UIView()
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        setupViews()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }
    
    private func setupViews() {
        // Background image
        backgroundImageView.contentMode = .scaleAspectFill
        backgroundImageView.clipsToBounds = true
        addSubview(backgroundImageView)
        
        // Gradient overlay
        overlayView.backgroundColor = .clear
        addSubview(overlayView)
        
        // Title
        titleLabel.font = UIFont.systemFont(ofSize: 36, weight: .bold)
        titleLabel.textAlignment = .center
        titleLabel.numberOfLines = 2
        titleLabel.layer.shadowColor = UIColor.black.cgColor
        titleLabel.layer.shadowOffset = CGSize(width: 0, height: 2)
        titleLabel.layer.shadowOpacity = 0.75
        titleLabel.layer.shadowRadius = 4
        addSubview(titleLabel)
        
        // Subtitle
        subtitleLabel.font = UIFont.systemFont(ofSize: 18, weight: .regular)
        subtitleLabel.textAlignment = .center
        subtitleLabel.numberOfLines = 2
        subtitleLabel.alpha = 0.9
        subtitleLabel.layer.shadowColor = UIColor.black.cgColor
        subtitleLabel.layer.shadowOffset = CGSize(width: 0, height: 1)
        subtitleLabel.layer.shadowOpacity = 0.75
        subtitleLabel.layer.shadowRadius = 3
        addSubview(subtitleLabel)
        
        // Corner radius
        layer.cornerRadius = 16
        layer.maskedCorners = [.layerMinXMaxYCorner, .layerMaxXMaxYCorner]
        clipsToBounds = true
    }
    
    override func layoutSubviews() {
        super.layoutSubviews()
        
        backgroundImageView.frame = bounds
        overlayView.frame = bounds
        
        // Add gradient if image is present
        if backgroundImageView.image != nil {
            overlayView.layer.sublayers?.forEach { $0.removeFromSuperlayer() }
            
            let gradientLayer = CAGradientLayer()
            gradientLayer.frame = bounds
            gradientLayer.colors = [
                UIColor.black.withAlphaComponent(0.4).cgColor,
                UIColor.black.withAlphaComponent(0.7).cgColor
            ]
            overlayView.layer.addSublayer(gradientLayer)
        }
        
        let contentHeight: CGFloat = 100
        let contentY = (bounds.height - contentHeight) / 2
        
        titleLabel.frame = CGRect(
            x: 24,
            y: contentY,
            width: bounds.width - 48,
            height: 50
        )
        
        subtitleLabel.frame = CGRect(
            x: 24,
            y: contentY + 58,
            width: bounds.width - 48,
            height: 40
        )
    }
    
    func configure(with theme: HeroBannerTheme) {
        titleLabel.text = theme.heroTitle
        subtitleLabel.text = theme.heroSubtitle
        
        backgroundColor = UIColor(hex: theme.heroBackgroundColor ?? "#020617")
        titleLabel.textColor = UIColor(hex: theme.heroTextColor ?? "#e5e7eb")
        subtitleLabel.textColor = UIColor(hex: theme.heroTextColor ?? "#e5e7eb")
        
        if let imageUrl = theme.heroBackgroundImageUrl,
           let url = URL(string: imageUrl) {
            // Load image (use SDWebImage or similar in production)
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                guard let data = data, let image = UIImage(data: data) else { return }
                DispatchQueue.main.async {
                    self?.backgroundImageView.image = image
                    self?.setNeedsLayout()
                }
            }.resume()
        } else {
            backgroundImageView.image = nil
        }
    }
}

// 3. Usage in ViewController
class HomeViewController: UIViewController {
    private let heroBannerView = HomeHeroBannerView()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = .systemBackground
        
        // Add hero banner
        heroBannerView.frame = CGRect(x: 0, y: 0, width: view.bounds.width, height: 250)
        view.addSubview(heroBannerView)
        
        // Load theme
        ThemeService.fetchTheme(brand: "jars") { [weak self] theme in
            guard let theme = theme else { return }
            DispatchQueue.main.async {
                self?.heroBannerView.configure(with: theme)
            }
        }
    }
}

// Helper for hex color parsing
extension UIColor {
    convenience init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            red: CGFloat(r) / 255,
            green: CGFloat(g) / 255,
            blue: CGFloat(b) / 255,
            alpha: CGFloat(a) / 255
        )
    }
}
```

---

## Caching Strategy

### Recommended Approach
1. **Fetch on app launch:** Call theme API during splash screen
2. **Cache locally:** Store theme in `AsyncStorage` / `SharedPreferences` / `UserDefaults`
3. **Cache duration:** 24 hours (86400 seconds)
4. **Background refresh:** Update on app foreground after cache expiry
5. **Fallback:** Use default values if API fails

### Example Cache Implementation (React Native)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const HERO_CACHE_KEY = '@nimbus/hero-theme';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedHeroTheme {
  theme: HeroBanner;
  timestamp: number;
}

export const loadHeroThemeWithCache = async (brand: string): Promise<HeroBanner> => {
  try {
    // 1. Check cache
    const cached = await AsyncStorage.getItem(HERO_CACHE_KEY);
    if (cached) {
      const { theme, timestamp }: CachedHeroTheme = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_DURATION_MS) {
        console.log('Using cached hero theme');
        return theme;
      }
    }

    // 2. Fetch fresh data
    const response = await fetch(
      `https://your-api.com/api/mobile-sanity-content/theme?brand=${brand}`
    );
    const data = await response.json();

    if (data.theme) {
      const heroTheme: HeroBanner = {
        heroTitle: data.theme.heroTitle ?? 'Welcome to Nimbus',
        heroSubtitle: data.theme.heroSubtitle ?? 'Curated cannabis experiences',
        heroBackgroundColor: data.theme.heroBackgroundColor ?? '#020617',
        heroTextColor: data.theme.heroTextColor ?? '#e5e7eb',
        heroBackgroundImageUrl: data.theme.heroBackgroundImageUrl ?? null,
      };

      // 3. Update cache
      const cacheData: CachedHeroTheme = {
        theme: heroTheme,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(HERO_CACHE_KEY, JSON.stringify(cacheData));
      return heroTheme;
    }

    // 4. Fallback to stale cache if API fails
    if (cached) {
      const { theme }: CachedHeroTheme = JSON.parse(cached);
      console.warn('Using stale cached hero theme (API failed)');
      return theme;
    }
  } catch (error) {
    console.error('Failed to load hero theme:', error);
  }

  // 5. Return defaults
  return {
    heroTitle: 'Welcome to Nimbus',
    heroSubtitle: 'Curated cannabis experiences',
    heroBackgroundColor: '#020617',
    heroTextColor: '#e5e7eb',
    heroBackgroundImageUrl: null,
  };
};
```

---

## Testing Checklist

### Functional Tests
- [ ] Hero title renders correctly
- [ ] Hero subtitle renders correctly
- [ ] Background color applies when no image
- [ ] Background image loads and displays
- [ ] Text color updates dynamically
- [ ] Default values load when API fails
- [ ] Text remains readable on dark/light backgrounds
- [ ] Hero banner scales correctly on different screen sizes (phone, tablet)

### Visual Tests
- [ ] Text has sufficient contrast (WCAG AA minimum 4.5:1)
- [ ] Image loads progressively without flickering
- [ ] Text shadow improves readability on image backgrounds
- [ ] Gradient overlay is subtle and doesn't obscure image
- [ ] Border radius applies correctly (bottom corners only)
- [ ] Layout centers content vertically and horizontally

### Edge Cases
- [ ] API timeout/failure uses cached theme
- [ ] Missing/null heroTitle defaults to "Welcome to Nimbus"
- [ ] Missing/null heroSubtitle defaults to "Curated cannabis experiences"
- [ ] Invalid hex colors fall back to theme defaults
- [ ] Broken image URL falls back to solid background
- [ ] Theme updates reflected after app restart
- [ ] Long text wraps correctly (2-line limit with ellipsis)

---

## Performance Considerations

### Optimization Tips
1. **Image optimization:** Use WebP format (70% smaller than JPEG)
2. **Lazy loading:** Defer image load until hero is visible
3. **Progressive enhancement:** Show placeholder while image loads
4. **Cache images:** Store downloaded images in device cache
5. **Preload on splash:** Fetch theme during splash screen to avoid delays
6. **Text rendering:** Use native text components, avoid custom fonts for performance

### Expected Performance
- **Initial load time:** < 300ms (with cached data)
- **Image load time:** < 1000ms (200KB image at 3G speed)
- **Memory overhead:** < 10MB for high-res image
- **Hero render cost:** < 16ms (60fps target)

### Image Optimization Example

```typescript
// React Native - Progressive image loading
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: theme.heroBackgroundImageUrl,
    priority: FastImage.priority.high,
    cache: FastImage.cacheControl.immutable,
  }}
  style={styles.backgroundImage}
  resizeMode={FastImage.resizeMode.cover}
>
  {/* Hero content */}
</FastImage>
```

---

## Troubleshooting

### Hero not appearing
1. Check `heroTitle` and `heroSubtitle` are not empty strings
2. Verify API response contains theme object
3. Ensure container has explicit height (not `auto`)
4. Check z-index doesn't hide hero behind other content

### Text not visible
1. Verify `heroTextColor` contrasts with background
2. Check text shadow is applied for image backgrounds
3. Ensure gradient overlay opacity is correct (0.4-0.7)
4. Validate hex colors are properly formatted

### Image not loading
1. Confirm `heroBackgroundImageUrl` is absolute URL
2. Check CORS policy allows image domain
3. Verify image URL is accessible (test in browser)
4. Debug console for network errors
5. Implement error handling with fallback to solid color

### Performance issues
1. Reduce image size (target < 200KB)
2. Use WebP format instead of JPEG/PNG
3. Implement progressive loading with placeholder
4. Profile with React DevTools / Xcode Instruments
5. Cache images locally after first download

---

## Configuration via Sanity CMS

Content editors can configure the home hero banner in Sanity Studio:

1. Navigate to **Content → Theme Configuration**
2. Select brand/store scope
3. Scroll to **Hero Banner** section
4. Enter **Hero title** (e.g., "Welcome to JARS")
5. Enter **Hero subtitle** (e.g., "Premium cannabis selection")
6. Select **Hero background color** (color picker)
7. Select **Hero text color** (color picker)
8. **Optional:** Upload **Hero background image**
9. Publish changes

Changes propagate to mobile apps within cache duration (24h default, instant if cache cleared).

---

## Configuration via Admin SPA

Brand managers can configure via Admin portal:

1. Login to Admin SPA
2. Navigate to **Theme** page (`/theme`)
3. Enter **Hero banner title** text field
4. Enter **Hero banner subtitle** text field
5. Select **Hero background color** with color picker
6. Select **Hero text color** with color picker
7. Enter **Hero background image URL** (optional)
8. Click **Save theme**

Preview updates immediately in the admin UI preview bar showing the hero title and subtitle.

---

## API Response Hierarchy

Theme resolution follows this precedence (highest to lowest):

1. **Store-specific theme** (`?brand=jars&store=downtown`)
2. **Brand-level theme** (`?brand=jars`)
3. **Global default theme** (no query params)

If a field is missing at a higher level, it falls back to the next level, then to defaults.

---

## Migration Notes

### Existing Apps
- New fields are **optional** and default to standard values
- No breaking changes to existing theme contract
- Apps can ignore new fields until ready to integrate
- Backwards compatible with v1 theme API

### Default Values
If theme API returns `null` or fields are missing:
```typescript
const defaults = {
  heroTitle: 'Welcome to Nimbus',
  heroSubtitle: 'Curated cannabis experiences',
  heroBackgroundColor: '#020617', // or theme.backgroundColor
  heroTextColor: '#e5e7eb', // or theme.textColor
  heroBackgroundImageUrl: null,
};
```

---

## Design Examples

### Example 1: Solid Background
```json
{
  "heroTitle": "Welcome to JARS",
  "heroSubtitle": "Premium cannabis selection",
  "heroBackgroundColor": "#1a1a1a",
  "heroTextColor": "#f5f5f5",
  "heroBackgroundImageUrl": null
}
```
**Result:** Dark gray background with white text

### Example 2: Image Background
```json
{
  "heroTitle": "Discover Nature",
  "heroSubtitle": "Organic, sustainable cannabis",
  "heroBackgroundColor": "#2d5016",
  "heroTextColor": "#ffffff",
  "heroBackgroundImageUrl": "https://cdn.sanity.io/images/cannabis-field.jpg"
}
```
**Result:** Nature image with white text overlay and dark gradient

### Example 3: Brand Colors
```json
{
  "heroTitle": "Your Wellness Journey",
  "heroSubtitle": "Starts here",
  "heroBackgroundColor": "#8b5cf6",
  "heroTextColor": "#fef3c7",
  "heroBackgroundImageUrl": null
}
```
**Result:** Purple brand background with warm yellow text

---

## Support & Questions

### API Documentation
- Full API reference: `docs/API_REFERENCE_ADMIN.md`
- Mobile content API: `docs/MOBILE_API_ENDPOINTS_ADDED.md`

### Schema Reference
- Sanity schema: `apps/studio/schemaTypes/__cms/themeConfig.ts`
- Theme types: `server/src/routes/content/theme.ts`

### Related Documentation
- Screen border customization: `MOBILE_SCREEN_BORDER_INTEGRATION.md`
- Theme configuration: `docs/THEME_CONFIGURATION.md`

### Contact
- Backend issues: Server team
- Schema questions: CMS team
- Mobile integration: This document + code examples above

---

## Version History

- **v1.0.0** (2026-02-20): Initial release
  - Added `heroTitle`, `heroSubtitle`, `heroBackgroundColor`, `heroTextColor`, `heroBackgroundImageUrl`
  - Available via `/theme` and `/all` endpoints
  - Configurable via Sanity CMS + Admin SPA
  - Default values: "Welcome to Nimbus" / "Curated cannabis experiences"

---

## Next Steps

1. ✅ Review this integration guide
2. ✅ Test theme API endpoint with your brand slug
3. ✅ Implement `HomeHeroBanner` component in your platform
4. ✅ Add caching layer (24h TTL recommended)
5. ✅ Test with solid backgrounds and image backgrounds
6. ✅ Verify text contrast and readability
7. ✅ Add analytics tracking for hero banner views
8. ✅ Submit for UI/UX review
9. ✅ Deploy to staging for QA testing
10. ✅ Roll out to production

---

**Questions?** Reach out to the platform team with this document as reference.
