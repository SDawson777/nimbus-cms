# Theme tokens example

This small example shows how to fetch the flattened theme contract from `/content/theme` and apply tokens as CSS variables. Use this in a web or mobile-web bootstrap step to make tokens available to CSS and JS.

```js
// fetch the flattened theme contract (example: client-side bootstrap)
async function applyTheme(brand, store) {
  const qs = new URLSearchParams()
  if (brand) qs.set('brand', brand)
  if (store) qs.set('store', store)
  const res = await fetch(`/content/theme?${qs.toString()}`)
  if (!res.ok) return
  const t = await res.json()

  // Map tokens to CSS variables on :root
  const root = document.documentElement
  root.style.setProperty('--accent-color', t.accentColor || '')
  root.style.setProperty('--surface-color', t.surfaceColor || '')
  root.style.setProperty('--muted-text-color', t.mutedTextColor || '')
  root.style.setProperty('--corner-radius', t.cornerRadius || '6px')
  root.style.setProperty('--elevation-style', t.elevationStyle || 'soft')

  // Example usage: toggle dark mode class
  if (t.darkModeEnabled) document.documentElement.classList.add('theme--dark')
  else document.documentElement.classList.remove('theme--dark')
}

// call at app bootstrap
applyTheme('brand-slug')
```

This lets you write CSS like:

```css
:root {
  --accent-color: #0070f3;
  --surface-color: #ffffff;
  --muted-text-color: #666666;
  --corner-radius: 6px;
}

.btn {
  background: var(--accent-color);
  border-radius: var(--corner-radius);
  color: white;
}
```

For native mobile (React Native), adapt by mapping the token object to style objects when rendering components.
