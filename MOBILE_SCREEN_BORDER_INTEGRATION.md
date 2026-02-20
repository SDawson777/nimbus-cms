# Mobile App Screen Border Integration Guide

## Overview

The Nimbus CMS now supports **white-label screen border customization** that can be configured via:
1. **Sanity CMS** (content editors)
2. **Admin SPA** (brand managers)

Mobile apps can fetch these settings from the theme API and render decorative borders around screens/views.

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
    
    // NEW: Screen Border Fields
    "screenBorderEnabled": true,
    "screenBorderColor": "#ffffff",
    "screenBorderPattern": "stripes"
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

### `screenBorderEnabled` (boolean)
- **Default:** `false`
- **Description:** Master toggle for screen border visibility
- **Usage:** Check this first before rendering any border

### `screenBorderColor` (string | null)
- **Default:** `null`
- **Format:** Hex color code (e.g., `#ffffff`, `#8b5cf6`)
- **Description:** Border color; also used as pattern fill color
- **Validation:** Matches `/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/`

### `screenBorderPattern` (string)
- **Default:** `"none"`
- **Options:** `"none"`, `"stripes"`, `"dots"`, `"grid"`
- **Description:** Visual pattern overlaid on the border

---

## Mobile Implementation Guide

### React Native Example

```tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // or react-native-linear-gradient

interface ScreenBorderTheme {
  screenBorderEnabled: boolean;
  screenBorderColor: string | null;
  screenBorderPattern: 'none' | 'stripes' | 'dots' | 'grid';
}

interface ThemeContextValue {
  theme: ScreenBorderTheme | null;
}

// 1. Fetch theme on app init
export const useTheme = () => {
  const [theme, setTheme] = useState<ScreenBorderTheme | null>(null);

  useEffect(() => {
    fetch('https://your-api.com/api/mobile-sanity-content/theme?brand=jars')
      .then(res => res.json())
      .then(data => {
        if (data.theme) {
          setTheme({
            screenBorderEnabled: data.theme.screenBorderEnabled ?? false,
            screenBorderColor: data.theme.screenBorderColor ?? '#ffffff',
            screenBorderPattern: data.theme.screenBorderPattern ?? 'none',
          });
        }
      })
      .catch(err => console.warn('Failed to load theme', err));
  }, []);

  return theme;
};

// 2. Create a reusable ScreenBorder component
export const ScreenBorder: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();

  if (!theme?.screenBorderEnabled) {
    return <>{children}</>;
  }

  const borderColor = theme.screenBorderColor || '#ffffff';
  const borderWidth = 6;

  return (
    <View style={styles.container}>
      {/* Main content */}
      {children}

      {/* Border overlay */}
      <View style={[styles.borderOverlay, { borderColor, borderWidth }]} pointerEvents="none">
        {theme.screenBorderPattern !== 'none' && (
          <BorderPattern pattern={theme.screenBorderPattern} color={borderColor} />
        )}
      </View>
    </View>
  );
};

// 3. Pattern renderer
const BorderPattern: React.FC<{ pattern: string; color: string }> = ({ pattern, color }) => {
  switch (pattern) {
    case 'stripes':
      return (
        <LinearGradient
          colors={[color, 'transparent', color, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.25, 0.5, 0.75]}
          style={StyleSheet.absoluteFill}
        />
      );
    
    case 'dots':
      // Use SVG or Canvas for dots pattern
      return <DotPattern color={color} />;
    
    case 'grid':
      return (
        <View style={styles.gridPattern}>
          {/* Render grid lines */}
        </View>
      );
    
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderStyle: 'solid',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
```

### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class ScreenBorderTheme {
  final bool enabled;
  final Color color;
  final String pattern;

  ScreenBorderTheme({
    required this.enabled,
    required this.color,
    required this.pattern,
  });

  factory ScreenBorderTheme.fromJson(Map<String, dynamic> json) {
    return ScreenBorderTheme(
      enabled: json['screenBorderEnabled'] ?? false,
      color: _parseColor(json['screenBorderColor']),
      pattern: json['screenBorderPattern'] ?? 'none',
    );
  }

  static Color _parseColor(String? hex) {
    if (hex == null) return Colors.white;
    return Color(int.parse(hex.substring(1), radix: 16) + 0xFF000000);
  }
}

// 1. Fetch theme
class ThemeService {
  static Future<ScreenBorderTheme?> fetchTheme(String brand) async {
    try {
      final response = await http.get(
        Uri.parse('https://your-api.com/api/mobile-sanity-content/theme?brand=$brand'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['theme'] != null) {
          return ScreenBorderTheme.fromJson(data['theme']);
        }
      }
    } catch (e) {
      print('Failed to load theme: $e');
    }
    return null;
  }
}

// 2. Screen border widget
class ScreenBorderWrapper extends StatelessWidget {
  final Widget child;
  final ScreenBorderTheme? theme;

  const ScreenBorderWrapper({
    Key? key,
    required this.child,
    this.theme,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (theme == null || !theme!.enabled) {
      return child;
    }

    return Stack(
      children: [
        child,
        Positioned.fill(
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(
                  color: theme!.color,
                  width: 6,
                ),
              ),
              child: theme!.pattern != 'none'
                  ? _buildPattern()
                  : null,
            ),
          ),
        ),
      ],
    );
  }

  Widget? _buildPattern() {
    switch (theme!.pattern) {
      case 'stripes':
        return CustomPaint(
          painter: StripesPainter(color: theme!.color),
        );
      case 'dots':
        return CustomPaint(
          painter: DotsPainter(color: theme!.color),
        );
      case 'grid':
        return CustomPaint(
          painter: GridPainter(color: theme!.color),
        );
      default:
        return null;
    }
  }
}

// 3. Example pattern painter
class StripesPainter extends CustomPainter {
  final Color color;

  StripesPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    for (double i = -size.height; i < size.width; i += 14) {
      canvas.drawLine(
        Offset(i, 0),
        Offset(i + size.height, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
```

### Swift/iOS Example

```swift
import UIKit

struct ScreenBorderTheme: Codable {
    let screenBorderEnabled: Bool
    let screenBorderColor: String?
    let screenBorderPattern: String
    
    enum CodingKeys: String, CodingKey {
        case screenBorderEnabled
        case screenBorderColor
        case screenBorderPattern
    }
}

struct ThemeResponse: Codable {
    let theme: ScreenBorderTheme?
}

// 1. Fetch theme
class ThemeService {
    static func fetchTheme(brand: String, completion: @escaping (ScreenBorderTheme?) -> Void) {
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

// 2. Apply border to view
extension UIView {
    func applyScreenBorder(theme: ScreenBorderTheme) {
        guard theme.screenBorderEnabled else { return }
        
        let borderWidth: CGFloat = 6
        let borderColor = UIColor(hex: theme.screenBorderColor ?? "#FFFFFF")
        
        // Add border layer
        let borderLayer = CALayer()
        borderLayer.frame = bounds
        borderLayer.borderWidth = borderWidth
        borderLayer.borderColor = borderColor.cgColor
        layer.addSublayer(borderLayer)
        
        // Add pattern if specified
        if theme.screenBorderPattern != "none" {
            let patternLayer = createPatternLayer(
                pattern: theme.screenBorderPattern,
                color: borderColor
            )
            layer.addSublayer(patternLayer)
        }
    }
    
    private func createPatternLayer(pattern: String, color: UIColor) -> CALayer {
        let layer = CALayer()
        layer.frame = bounds
        
        switch pattern {
        case "stripes":
            // Draw repeating diagonal stripes
            let path = UIBezierPath()
            let spacing: CGFloat = 14
            for x in stride(from: -bounds.height, to: bounds.width, by: spacing) {
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x + bounds.height, y: bounds.height))
            }
            
            let shapeLayer = CAShapeLayer()
            shapeLayer.path = path.cgPath
            shapeLayer.strokeColor = color.withAlphaComponent(0.3).cgColor
            shapeLayer.lineWidth = 2
            layer.addSublayer(shapeLayer)
            
        case "dots":
            // Draw dot grid
            let spacing: CGFloat = 12
            for x in stride(from: CGFloat(0), to: bounds.width, by: spacing) {
                for y in stride(from: CGFloat(0), to: bounds.height, by: spacing) {
                    let dotLayer = CAShapeLayer()
                    dotLayer.path = UIBezierPath(
                        arcCenter: CGPoint(x: x, y: y),
                        radius: 1.5,
                        startAngle: 0,
                        endAngle: .pi * 2,
                        clockwise: true
                    ).cgPath
                    dotLayer.fillColor = color.cgColor
                    layer.addSublayer(dotLayer)
                }
            }
            
        case "grid":
            // Draw grid lines
            let path = UIBezierPath()
            let spacing: CGFloat = 20
            
            // Vertical lines
            for x in stride(from: CGFloat(0), to: bounds.width, by: spacing) {
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: bounds.height))
            }
            
            // Horizontal lines
            for y in stride(from: CGFloat(0), to: bounds.height, by: spacing) {
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: bounds.width, y: y))
            }
            
            let shapeLayer = CAShapeLayer()
            shapeLayer.path = path.cgPath
            shapeLayer.strokeColor = color.withAlphaComponent(0.2).cgColor
            shapeLayer.lineWidth = 1
            layer.addSublayer(shapeLayer)
            
        default:
            break
        }
        
        return layer
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

## Pattern Implementation Details

### Stripes Pattern
- **Visual:** Diagonal repeating lines at 45° angle
- **Spacing:** 14px between lines
- **Line width:** 2px
- **Opacity:** 0.3 (30% of border color)

### Dots Pattern
- **Visual:** Evenly-spaced circular dots
- **Spacing:** 12px grid
- **Dot radius:** 1.5px
- **Opacity:** Full color

### Grid Pattern
- **Visual:** Horizontal and vertical lines forming a grid
- **Spacing:** 20px between lines
- **Line width:** 1px
- **Opacity:** 0.2 (20% of border color)

### None Pattern
- No pattern overlay
- Just the solid border color

---

## Caching Strategy

### Recommended Approach
1. **Fetch on app launch:** Call theme API during splash screen
2. **Cache locally:** Store theme in `AsyncStorage` / `SharedPreferences` / `UserDefaults`
3. **Cache duration:** 24 hours (86400 seconds)
4. **Background refresh:** Update on app foreground after cache expiry
5. **Fallback:** Use last cached values if API fails

### Example Cache Implementation (React Native)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_CACHE_KEY = '@nimbus/theme';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedTheme {
  theme: ScreenBorderTheme;
  timestamp: number;
}

export const loadThemeWithCache = async (brand: string): Promise<ScreenBorderTheme | null> => {
  try {
    // 1. Check cache
    const cached = await AsyncStorage.getItem(THEME_CACHE_KEY);
    if (cached) {
      const { theme, timestamp }: CachedTheme = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age < CACHE_DURATION_MS) {
        console.log('Using cached theme');
        return theme;
      }
    }

    // 2. Fetch fresh data
    const response = await fetch(
      `https://your-api.com/api/mobile-sanity-content/theme?brand=${brand}`
    );
    const data = await response.json();

    if (data.theme) {
      // 3. Update cache
      const cacheData: CachedTheme = {
        theme: data.theme,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cacheData));
      return data.theme;
    }

    // 4. Fallback to stale cache if API fails
    if (cached) {
      const { theme }: CachedTheme = JSON.parse(cached);
      console.warn('Using stale cached theme (API failed)');
      return theme;
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }

  return null;
};
```

---

## Testing Checklist

### Functional Tests
- [ ] Border renders when `screenBorderEnabled: true`
- [ ] Border hidden when `screenBorderEnabled: false`
- [ ] Border color updates dynamically
- [ ] Each pattern (none, stripes, dots, grid) renders correctly
- [ ] Border respects safe area insets (iOS notch, Android navigation)
- [ ] Border scales correctly on different screen sizes (phone, tablet)

### Visual Tests
- [ ] Border doesn't interfere with touch/tap events
- [ ] Pattern opacity is correct (stripes: 30%, grid: 20%, dots: 100%)
- [ ] Border width is consistent (6px)
- [ ] Patterns align correctly at screen edges
- [ ] No performance degradation on low-end devices

### Edge Cases
- [ ] API timeout/failure uses cached theme
- [ ] Missing/null border color defaults to white
- [ ] Invalid pattern value defaults to "none"
- [ ] Theme updates reflected after app restart
- [ ] Works with dark mode enabled

---

## Performance Considerations

### Optimization Tips
1. **Use native drawing APIs:** Avoid React re-renders for static borders
2. **Memoize pattern layers:** Cache pattern renderers, don't recreate on every render
3. **Disable on low-end devices:** Check device capabilities, skip patterns if needed
4. **Lazy load patterns:** Only render pattern when screen is visible
5. **Test on real devices:** Simulators don't reflect actual GPU performance

### Expected Performance
- **Border render time:** < 16ms (60fps)
- **Memory overhead:** < 5MB for pattern layers
- **Pattern render cost:**
  - None: ~0ms (just border)
  - Stripes: ~2-4ms
  - Dots: ~3-6ms (density-dependent)
  - Grid: ~2-4ms

---

## Troubleshooting

### Border not appearing
1. Check `screenBorderEnabled` is `true` in API response
2. Verify `screenBorderColor` is valid hex (e.g., `#ffffff`)
3. Ensure border layer is added above content but allows pointer events
4. Check z-index/elevation doesn't hide border

### Pattern not visible
1. Confirm `screenBorderPattern` is one of: `stripes`, `dots`, `grid`
2. Check pattern opacity isn't too low
3. Verify pattern color contrasts with background
4. Debug pattern rendering logic (console logs, visual debugger)

### Performance issues
1. Reduce pattern density (increase spacing)
2. Use simpler pattern (grid < stripes < dots)
3. Disable patterns on <= iPhone 8 / low RAM Android devices
4. Profile with React DevTools / Xcode Instruments

### API/Cache issues
1. Verify endpoint URL is correct: `/api/mobile-sanity-content/theme`
2. Check network connectivity
3. Inspect cache expiry logic (24h default)
4. Clear app cache and re-fetch

---

## Example Screen Integration

### Home Screen with Border

```tsx
// App.tsx
import { ScreenBorder } from './components/ScreenBorder';

export default function App() {
  return (
    <ScreenBorder>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Product" component={ProductScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ScreenBorder>
  );
}
```

### Per-Screen Border (Alternative)

```tsx
// HomeScreen.tsx
import { ScreenBorder } from './components/ScreenBorder';

export const HomeScreen = () => {
  return (
    <ScreenBorder>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          {/* Your content */}
        </ScrollView>
      </SafeAreaView>
    </ScreenBorder>
  );
};
```

---

## Configuration via Sanity CMS

Content editors can configure borders in Sanity Studio:

1. Navigate to **Content → Theme Configuration**
2. Select brand/store scope
3. Toggle **"Screen border enabled"**
4. Choose **"Screen border color"** (color picker)
5. Select **"Screen border pattern"** dropdown
6. Publish changes

Changes propagate to mobile apps within cache duration (24h default, instant if cache cleared).

---

## Configuration via Admin SPA

Brand managers can configure via Admin portal:

1. Login to Admin SPA
2. Navigate to **Theme** page (`/theme`)
3. Toggle **"Enable screen border"** checkbox
4. Select border color with color picker
5. Choose pattern from dropdown (None/Stripes/Dots/Grid)
6. Click **"Save theme"**

Preview updates immediately in the admin UI preview bar.

---

## API Response Hierarchy

Theme resolution follows this precedence (highest to lowest):

1. **Store-specific theme** (`?brand=jars&store=downtown`)
2. **Brand-level theme** (`?brand=jars`)
3. **Global default theme** (no query params)

If a field is missing at a higher level, it falls back to the next level.

---

## Migration Notes

### Existing Apps
- New fields are **optional** and default to disabled
- No breaking changes to existing theme contract
- Apps can ignore new fields until ready to integrate
- Backwards compatible with v1 theme API

### Default Values
If theme API returns `null` or fields are missing:
```typescript
const defaults = {
  screenBorderEnabled: false,
  screenBorderColor: '#ffffff',
  screenBorderPattern: 'none',
};
```

---

## Support & Questions

### API Documentation
- Full API reference: `docs/API_REFERENCE_ADMIN.md`
- Mobile content API: `docs/MOBILE_API_ENDPOINTS_ADDED.md`

### Schema Reference
- Sanity schema: `apps/studio/schemaTypes/__cms/themeConfig.ts`
- Theme types: `server/src/routes/content/theme.ts`

### Contact
- Backend issues: Server team
- Schema questions: CMS team
- Mobile integration: This document + code examples above

---

## Version History

- **v1.0.0** (2026-02-20): Initial release
  - Added `screenBorderEnabled`, `screenBorderColor`, `screenBorderPattern`
  - Supports 4 patterns: none, stripes, dots, grid
  - Available via `/theme` and `/all` endpoints
  - Configurable via Sanity CMS + Admin SPA

---

## Next Steps

1. ✅ Review this integration guide
2. ✅ Test theme API endpoint with your brand slug
3. ✅ Implement `ScreenBorder` component in your platform
4. ✅ Add caching layer (24h TTL recommended)
5. ✅ Test all 4 patterns on real devices
6. ✅ Add toggle in app settings to disable borders (user preference)
7. ✅ Submit for UI/UX review
8. ✅ Deploy to staging for QA testing
9. ✅ Roll out to production

---

**Questions?** Reach out to the platform team with this document as reference.
