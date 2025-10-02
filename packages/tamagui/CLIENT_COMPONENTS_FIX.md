# Client Components Fix - Next.js App Router

## The Issue

With Next.js App Router, all pages are **Server Components by default**. When a page imports:
- React hooks (useState, useEffect, useContext, etc.)
- Tamagui components (which use React Context internally)
- Any interactive UI components

It **must** be marked as a **Client Component** with `'use client'`.

## The Error

```
TypeError: createReactContext is not a function
```

This error occurs when Tamagui tries to create a React Context on the **server side**, which isn't supported.

## The Solution

Add `'use client'` directive to **all page files** that:
1. Import Tamagui components (`YStack`, `XStack`, `Text`, etc.)
2. Import feature screens (which use hooks)
3. Have any interactivity

## Files Fixed

✅ All page files now have `'use client'`:
- `/app/page.tsx` 
- `/app/chart/page.tsx` ✅ **This was the issue!**
- `/app/search/page.tsx`
- `/app/sign-in/page.tsx`
- `/app/sign-up/page.tsx`
- `/app/profile/page.tsx`
- `/app/privacy/page.tsx`
- `/app/terms/page.tsx`
- `/app/music/[id]/page.tsx`
- `/app/user/[id]/page.tsx`
- `/app/test/page.tsx`

## Key Learnings

### When to use `'use client'`:
- ✅ Pages that import Tamagui components
- ✅ Pages with forms, buttons, or interactivity
- ✅ Pages using hooks or state management
- ✅ Pages importing feature screens (which have hooks)

### When NOT to use `'use client'`:
- ❌ Pure data-fetching pages with no UI
- ❌ Markdown/static content pages
- ❌ Pages that only render server components

## Note on Metadata

When you add `'use client'`, you **cannot** export `metadata` from the same file anymore. 

**Before** (Server Component):
```tsx
export const metadata = {
  title: 'Chart - Skyhitz',
}
```

**After** (Client Component):
```tsx
'use client'
// metadata export removed - handle with <title> tags if needed
```

For client components, you can:
1. Use `<title>` tags directly
2. Use `next/head` for dynamic metadata
3. Keep metadata in a parent layout (which stays server-side)

## Why This Matters

This is a **fundamental Next.js 13+ App Router concept**:
- Server Components = default, run on server
- Client Components = marked with `'use client'`, run on client
- Mixing them requires understanding the boundaries

Without proper `'use client'` directives, you'll get:
- Context errors
- Hook errors  
- SSR/hydration mismatches

## Result

✅ All pages now work correctly with Tamagui + React 19 + react-native-web 0.21!

