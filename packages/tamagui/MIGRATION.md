# Skyhitz Tamagui Migration Plan

## Overview
Migrating from Solito + NativeWind setup to Tamagui for better Web + Native + SSR support.

## App Structure Analysis

### Core Features to Migrate
1. **Home/Landing** - Hero, CTA, Featured sections, Blog, FAQ
2. **Authentication** - Sign In, Sign Up, Email auth, Wallet connect
3. **Search** - Algolia search, Recently added, Combined results
4. **Chart** - Top chart entries
5. **Entry/Music** - Music player, entry details, investment section, likes
6. **Profile** - User profile, edit, collection, likes, send XLM
7. **Blog** - Blog posts and individual post pages
8. **Legal** - Terms, Privacy
9. **Top Up** - Stripe payments for XLM

### Technical Stack to Migrate

#### State Management
- **Zustand stores**: player, entry, user, theme, topup
- Keep Zustand (works great with Tamagui)

#### API Layer
- **GraphQL**: Apollo Client for mutations
- **Algolia**: Search functionality
- **Storage**: Secure storage for auth tokens
- Keep all existing API layer

#### Core Dependencies
- `@apollo/client` - Keep
- `algoliasearch` - Keep
- `@stripe/react-stripe-js` - Keep
- `formik` + `yup` - Keep for forms
- `zustand` - Keep for state
- `swr` - Keep for data fetching
- `ramda` - Keep for utilities
- **REMOVE**: `solito`, `nativewind`
- **ADD**: Tamagui components

#### Navigation
- **Web**: Next.js App Router (already in Tamagui starter)
- **Native**: Expo Router (already in Tamagui starter)
- Migrate from Solito's routing to Expo Router + Next App Router

## Migration Strategy

### Phase 1: Setup & Configuration (Current)
- [x] Create Tamagui workspace
- [x] Update workspace name to @skyhitz/tamagui
- [ ] Add core dependencies (Apollo, Algolia, Stripe, Zustand, etc)
- [ ] Migrate config files (GraphQL, Algolia, Analytics, etc)
- [ ] Set up theme system (colors, fonts, tokens)

### Phase 2: State & Services
- [ ] Migrate Zustand stores
- [ ] Migrate GraphQL client and mutations
- [ ] Migrate Algolia search service
- [ ] Migrate auth service
- [ ] Migrate storage service
- [ ] Migrate analytics

### Phase 3: Design System
- [ ] Create Tamagui theme tokens (colors, spacing, etc)
- [ ] Migrate typography components to Tamagui Text
- [ ] Migrate buttons to Tamagui Button
- [ ] Create custom Tamagui components for app-specific needs
- [ ] Migrate icons (keep react-native-svg)

### Phase 4: Core UI Components
- [ ] Hero section
- [ ] Navbar
- [ ] Footer
- [ ] CTA Banner
- [ ] Featured section
- [ ] Blog section
- [ ] Card components
- [ ] Modal components
- [ ] Toast system

### Phase 5: Feature Screens
- [ ] Home screen
- [ ] Sign In / Sign Up
- [ ] Search screen
- [ ] Chart screen
- [ ] Entry/Music screen with player
- [ ] Profile screens (main, edit, collection, likes)
- [ ] Blog screens
- [ ] Legal screens
- [ ] Top Up screen

### Phase 6: Navigation & Routing
- [ ] Set up Expo Router navigation structure
- [ ] Set up Next.js App Router structure
- [ ] Migrate all routes
- [ ] Add auth guards
- [ ] Deep linking setup

### Phase 7: Testing & Polish
- [ ] Test all flows on web
- [ ] Test all flows on native (iOS/Android)
- [ ] Fix SSR hydration issues
- [ ] Performance optimization
- [ ] SEO metadata migration

## Key Differences from Solito

### Routing
**Solito**: Manual route setup with `solito/link`
**Tamagui**: 
- Web: Next.js App Router (`/app` directory)
- Native: Expo Router (file-based routing in `/app`)

### Styling
**Solito/NativeWind**: Tailwind classes via `className`
**Tamagui**: 
- Component props + tokens
- Type-safe styling
- Better performance (compile-time optimization)

### Components
**Solito**: React Native components + className
**Tamagui**: Tamagui components with built-in theming

## Benefits of This Migration
1. **No FOUC** - Tamagui handles SSR styling perfectly
2. **Better DX** - Type-safe styling, better autocomplete
3. **Performance** - Compile-time optimization
4. **Theming** - Built-in dark/light mode support
5. **Animations** - Smooth animations with Moti integration
6. **Future-proof** - Active development, better ecosystem support

