# SSR Architecture - Server & Client Components

## The Correct Pattern for Next.js App Router + Tamagui

### Architecture Overview

```
Page (Server Component)
  └─> Screen (Client Component)
       └─> UI Components (Tamagui)
```

## The Pattern

### 1. **Pages** = Server Components (Default)
**Location**: `/app/**/page.tsx`

**Responsibilities**:
- Server-side data fetching
- SEO metadata
- Initial data loading
- Routing parameters

**Example**:
```tsx
// app/chart/page.tsx
import { ChartScreen } from 'app/features/chart/screen'

export default function ChartPage() {
  // Could fetch data here server-side
  // const data = await fetch(...)
  
  return <ChartScreen />
}

export const metadata = {
  title: 'Top Chart - Skyhitz',
  description: 'Discover the top trending music',
}
```

### 2. **Screens** = Client Components
**Location**: `/packages/app/features/**/screen.tsx`

**Responsibilities**:
- Interactive UI
- React hooks (useState, useEffect)
- Client-side state management
- User interactions

**Example**:
```tsx
// packages/app/features/chart/screen.tsx
'use client'
import { useState } from 'react'
import { YStack } from 'tamagui'

export function ChartScreen() {
  const [data, setData] = useState([])
  
  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Interactive UI */}
    </YStack>
  )
}
```

## Why This Matters

### ✅ Benefits of Server Components (Pages)

1. **SEO**: Search engines can crawl content
2. **Performance**: Less JavaScript sent to client
3. **Security**: Keep sensitive logic on server
4. **Data Fetching**: Fetch data on server, closer to database
5. **Metadata**: Dynamic meta tags for social sharing

### ✅ Benefits of Client Components (Screens)

1. **Interactivity**: Use hooks, state, effects
2. **Tamagui**: Components need React Context (client-only)
3. **Real-time**: WebSocket, subscriptions
4. **User Input**: Forms, buttons, gestures

## Current Implementation

### All Pages (Server Components)
- ✅ `/app/page.tsx` - Home
- ✅ `/app/chart/page.tsx` - Chart
- ✅ `/app/search/page.tsx` - Search
- ✅ `/app/sign-in/page.tsx` - Sign In
- ✅ `/app/sign-up/page.tsx` - Sign Up
- ✅ `/app/profile/page.tsx` - Profile
- ✅ `/app/privacy/page.tsx` - Privacy
- ✅ `/app/terms/page.tsx` - Terms
- ✅ `/app/music/[id]/page.tsx` - Music Detail
- ✅ `/app/user/[id]/page.tsx` - User Profile

### All Screens (Client Components)
- ✅ All files in `/packages/app/features/**/screen.tsx` have `'use client'`
- ✅ All interactive UI components marked as client

## Rules to Follow

### ❌ DON'T
```tsx
// app/chart/page.tsx
'use client' // ❌ Don't do this on pages!
import { YStack } from 'tamagui'

export default function ChartPage() {
  return <YStack>...</YStack>
}
```

### ✅ DO
```tsx
// app/chart/page.tsx
import { ChartScreen } from 'app/features/chart/screen'

export default function ChartPage() {
  return <ChartScreen />
}

export const metadata = { ... } // ✅ Works in Server Components
```

```tsx
// packages/app/features/chart/screen.tsx
'use client' // ✅ Mark screen as client
import { YStack } from 'tamagui'

export function ChartScreen() {
  return <YStack>...</YStack>
}
```

## Advanced: Server-Side Data Fetching

### Future Enhancement
```tsx
// app/chart/page.tsx
import { ChartScreen } from 'app/features/chart/screen'

async function getChartData() {
  const res = await fetch('https://api.skyhitz.com/chart', {
    cache: 'no-store' // or { next: { revalidate: 60 } }
  })
  return res.json()
}

export default async function ChartPage() {
  const initialData = await getChartData() // Server-side fetch
  
  return <ChartScreen initialData={initialData} />
}
```

## Why We Had the Error

**Before** (Wrong):
```
Page (Server Component)
 └─> YStack from Tamagui ❌
      ↳ Tries to use React.createContext on server
      ↳ Error: createReactContext is not a function
```

**After** (Correct):
```
Page (Server Component)
 └─> Screen (Client Component) ✅
      └─> YStack from Tamagui ✅
           ↳ Context works on client
```

## Key Takeaways

1. **Pages** = Server Components = Data & Metadata
2. **Screens** = Client Components = Interactivity & UI
3. **Never** use Tamagui directly in page.tsx files
4. **Always** have a screen.tsx that's marked `'use client'`
5. **Metadata** only works in Server Components

## Benefits We Get

✅ **Full SSR** - Initial HTML rendered on server
✅ **SEO** - Search engines see content
✅ **Performance** - Less JavaScript to download
✅ **Interactivity** - Full React features in screens
✅ **Best of Both** - Server rendering + client interactivity

This is the **correct** way to use Next.js 13+ App Router with Tamagui!

