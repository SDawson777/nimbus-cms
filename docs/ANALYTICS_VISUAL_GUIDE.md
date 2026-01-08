# Analytics Dashboard - Visual Guide

## 📊 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     NIMBUS CMS ANALYTICS                            │
│                                                                     │
│  [7 Days] [30 Days] [90 Days]  ← Period Selector                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 💰 Revenue   │ 📦 Orders    │ 👥 Customers │ 📊 Products  │
│              │              │              │              │
│  $12,450     │    156       │     89       │    245       │
│  ↑ 15.5%     │  ↑ 12.3%     │  ↑ 8.7%      │   Active     │
│              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌────────────────────────────────┬────────────────────────────────┐
│  Revenue Trend (Line Chart)    │  Order Volume (Bar Chart)      │
│                                │                                │
│     ┌────────────────────┐     │     ┌────────────────────┐     │
│     │    /\        /\    │     │     │  ║  ║    ║║  ║    │     │
│     │   /  \      /  \   │     │     │  ║  ║    ║║  ║    │     │
│     │  /    \    /    \  │     │     │  ║  ║    ║║  ║    │     │
│     │ /      \  /      \ │     │     │ ║║ ║║   ║║║ ║║    │     │
│     └────────────────────┘     │     └────────────────────┘     │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘

┌────────────────────────────────┐
│  Order Status (Donut Chart)    │
│                                │
│         ╭─────╮                │
│      ╭──┤  O  ├──╮             │
│      │  ╰─────╯  │             │
│      ╰───────────╯             │
│                                │
│  ● FULFILLED (64%)             │
│  ● PAID (29%)                  │
│  ● PENDING (4%)                │
│  ● CANCELLED (3%)              │
│                                │
└────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  🏆 Top 10 Products                                                 │
├──────┬────────────────────────┬──────────┬──────────┬─────────────┤
│ Rank │ Product                │ Sales    │ Revenue  │ Price       │
├──────┼────────────────────────┼──────────┼──────────┼─────────────┤
│  1   │ Premium Widget         │   245    │ $4,900   │ $20.00      │
│  2   │ Deluxe Gadget          │   189    │ $5,670   │ $30.00      │
│  3   │ Standard Item          │   156    │ $1,560   │ $10.00      │
│  ...│                        │          │          │             │
└──────┴────────────────────────┴──────────┴──────────┴─────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  📋 Recent 10 Orders                                                │
├──────────────┬──────────┬────────────┬────────────┬───────────────┤
│ Order ID     │ Customer │ Total      │ Store      │ Status        │
├──────────────┼──────────┼────────────┼────────────┼───────────────┤
│ ORD-12345    │ John Doe │ $149.99    │ Downtown   │ ✅ FULFILLED  │
│ ORD-12344    │ Jane S.  │ $89.50     │ Mall       │ 💳 PAID       │
│ ORD-12343    │ Bob M.   │ $199.00    │ Airport    │ ⏳ PENDING    │
│  ...        │          │            │            │               │
└──────────────┴──────────┴────────────┴────────────┴───────────────┘
```

## 🎨 Design Features

### Colors
- **Background**: `#f5f5f7` (light gray)
- **Cards**: White with subtle shadow
- **Primary**: `#007aff` (Apple blue)
- **Success**: `#34c759` (green for positive trends)
- **Danger**: `#ff3b30` (red for negative trends)
- **Warning**: `#ff9500` (orange for alerts)

### Typography
- **Headings**: `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`
- **Body**: System font stack
- **Numbers**: Tabular figures for alignment

### Interactions
- **Hover Effects**: Cards lift on hover
- **Transitions**: 0.2s ease for smooth animations
- **Loading States**: Skeleton loaders
- **Error States**: Friendly error messages with retry button

## 📱 Responsive Breakpoints

### Desktop (>1024px)
- 4-column metric grid
- 2-column chart layout
- Full-width tables

### Tablet (768px - 1024px)
- 2-column metric grid
- 1-column chart layout
- Scrollable tables

### Mobile (<768px)
- 1-column everything
- Stacked cards
- Touch-friendly buttons
- Horizontal scroll for tables

## 🔄 Data Flow

```
User Action → Component State → API Call → Database Query → Response
                    ↓                                           ↓
              Loading State                              Success/Error
                    ↓                                           ↓
              Show Skeleton                         Update State & Re-render
```

### Example: Period Change
```
1. User clicks "90 Days" button
   └─> setPeriod('90')
       └─> useEffect triggers
           └─> fetchAnalytics()
               └─> fetch('/api/v1/nimbus/analytics/production/overview?period=90')
                   └─> Server queries last 90 days
                       └─> Returns metrics + charts data
                           └─> setData(response)
                               └─> Components re-render with new data
                                   └─> Charts animate to new values
```

## 🎯 User Interactions

### 1. Period Selection
```
[ 7 Days ] [30 Days] [90 Days]
    ↑         ↑         ↑
  Recent   Default   Long-term
```

**What happens:**
- Button becomes active (blue background)
- Loading indicator appears
- Charts animate to new data
- Trends recalculate for comparison

### 2. Hover States

**Metric Cards:**
```
Normal:  ┌──────────┐
         │ $12,450  │
         └──────────┘

Hover:   ┌──────────┐  ← Lifts up
         │ $12,450  │  ← Slightly larger
         └──────────┘  ← Stronger shadow
```

**Chart Points:**
```
Normal: ●────────●────────●

Hover:  ●────────●────────●
                 ↑
           Tooltip shows:
           "Day 15: $520"
```

### 3. Error Handling

**No Data:**
```
┌─────────────────────────────┐
│  📊 No Data Available       │
│                             │
│  No orders in this period   │
│                             │
│      [Refresh]              │
└─────────────────────────────┘
```

**API Error:**
```
┌─────────────────────────────┐
│  ⚠️  Failed to Load Data    │
│                             │
│  Could not connect to API   │
│                             │
│      [Try Again]            │
└─────────────────────────────┘
```

## 🏪 Multi-Store View (NEW)

### Store Analytics Endpoint
```
GET /api/v1/nimbus/analytics/production/stores?period=30
```

### Visual Representation
```
┌─────────────────────────────────────────────────────────────────────┐
│  🏪 Store Performance                                               │
├──────┬────────────────────┬─────────┬───────────┬──────────────────┤
│ Rank │ Store              │ Orders  │ Revenue   │ Engagement       │
├──────┼────────────────────┼─────────┼───────────┼──────────────────┤
│  1   │ Downtown Store     │   156   │ $12,450   │ ████████░░ 847   │
│  2   │ Mall Location      │   123   │ $9,870    │ ██████░░░░ 623   │
│  3   │ Airport Shop       │    98   │ $8,234    │ █████░░░░░ 534   │
│  4   │ Suburbs Plaza      │    67   │ $5,432    │ ████░░░░░░ 401   │
│  5   │ Beach Outlet       │    45   │ $3,890    │ ███░░░░░░░ 289   │
└──────┴────────────────────┴─────────┴───────────┴──────────────────┘
```

### Heatmap Integration
```
      Geographic View

  ┌─────────────────────────────┐
  │                             │
  │       🔴 ← Downtown (847)   │
  │                             │
  │   🟠 ← Mall (623)           │
  │                             │
  │            🟡 ← Airport     │
  │                   (534)     │
  │  🔵 ← Beach (289)           │
  │                             │
  └─────────────────────────────┘

Legend:
🔴 High engagement (700-1000)
🟠 Good engagement (500-699)
🟡 Moderate (300-499)
🔵 Low (<300)

Circle Size = Engagement Score
```

## 🎬 Animation Examples

### Metric Card Loading
```
Step 1: Skeleton
┌──────────────┐
│ ░░░░░░░      │
│ ░░░░░░░░░    │
└──────────────┘

Step 2: Fade In
┌──────────────┐
│ 💰 Revenue   │  ← Fades in
│  $12,450     │  ← Counts up
│  ↑ 15.5%     │  ← Slides up
└──────────────┘
```

### Chart Animation
```
Frame 1:       ●──────
Frame 2:       ●─────●───
Frame 3:       ●────●───●────
Frame 4:       ●───●──●───●───●  ← Draws progressively
```

### Trend Indicator
```
Positive:  ↗ 15.5%  (green, slides up)
Negative:  ↘ -8.2%  (red, slides down)
Neutral:   → 0.0%   (gray, stays)
```

## 📊 Chart Details

### Line Chart (Revenue Trend)
- **Type**: Area chart with gradient fill
- **X-Axis**: Days in period
- **Y-Axis**: Revenue ($)
- **Interaction**: Hover to see exact values
- **Animation**: Draws from left to right

### Bar Chart (Order Volume)
- **Type**: Vertical bars with gradients
- **X-Axis**: Days in period
- **Y-Axis**: Order count
- **Interaction**: Click to drill down (future)
- **Animation**: Grows from bottom

### Donut Chart (Order Status)
- **Type**: Ring chart with legend
- **Segments**: One per status
- **Colors**: Status-specific (green=fulfilled, blue=paid, etc.)
- **Interaction**: Hover to highlight segment
- **Animation**: Rotates into view

## 🚀 Performance

### Load Times
- **Initial Load**: <2s for full dashboard
- **Period Switch**: <500ms
- **Chart Render**: <100ms

### Optimizations
- ✅ Parallel API queries
- ✅ Indexed database queries
- ✅ SVG charts (no external libraries)
- ✅ Memoized calculations
- ✅ Lazy loading for tables

## 🧪 Testing Checklist

- [x] Dashboard loads without errors
- [x] All metrics display correctly
- [x] Charts render with custom SVG
- [x] Period selector changes data
- [x] Trends calculate correctly
- [x] Responsive on mobile/tablet
- [x] Loading states show
- [x] Error states handle gracefully
- [x] Multi-store aggregation works
- [x] Store analytics endpoint created
- [ ] Heatmap visualization integrated (Next step)
- [ ] Real-time updates (polling/WebSocket)
- [ ] Export to CSV
- [ ] Custom date ranges

---

**Access the dashboard:**
```
http://localhost:5175/analytics
```

**Try it:**
1. Click between period buttons
2. Hover over charts to see tooltips
3. Scroll through tables
4. Check the browser console for data structure
