# Deprecated Files and Components

This document tracks files and components that have been deprecated during the codebase cleanup and URL structure simplification project.

## Navigation System Refactoring (May 2025)

The following files have been deprecated and replaced with more appropriately named components:

| Old Component/File | New Component/File | Notes |
|-------------------|-------------------|-------|
| `DashboardLayout.tsx` | `MainLayout.tsx` | Layout component that conditionally applies navigation based on route |
| `DashboardNavigation.tsx` | `MainNavigation.tsx` | Main navigation container with responsive behavior |
| `DashboardTabBar.tsx` | `MainTabBar.tsx` | Tab bar component for app navigation |

## URL Structure Simplification (May 2025)

The following URL structure changes were made to simplify routes:

| Old Route | New Route | Notes |
|-----------|-----------|-------|
| `/dashboard/profile` | `/profile` | |
| `/dashboard/profile/likes` | `/profile/likes` | |
| `/dashboard/profile/collection` | `/profile/collection` | |
| `/dashboard/profile/edit` | `/profile/edit` | |
| `/dashboard/chart` | `/chart` | |
| `/dashboard/beat/[id]` | `/music/[id]` | Beat routes simplified to music, internal components renamed to Entry |
| `/beat/[id]` | `/music/[id]` | Final migration from beat to music URL structure |
| `/dashboard/search` | `/search` | |

The `/dashboard` directory and all its components have been removed, with any necessary functionality moved to the root features directory.

## Beat to Music/Entry Refactoring (Jan 2025)

The following changes were made to clarify naming and improve URL structure:

| Component/Directory | Old Name | New Name | Notes |
|---------------------|----------|----------|-------|
| **Features Directory** | `features/beat/` | `features/entry/` | Internal naming uses "entry" to match Algolia data model |
| **App Routes** | `app/beat/[id]/` | `app/music/[id]/` | Public URL uses "music" for clarity |
| **Components** | `BeatScreen` | `EntryScreen` | |
| **Components** | `BeatDetails` | `EntryDetails` | |
| **Components** | `BeatSummaryColumn` | `EntrySummaryColumn` | |
| **Hooks** | `useBeatParam` | `useEntryParam` | |
| **Route Constants** | `ROUTES.BEAT` | `ROUTES.MUSIC` | |

### URL Structure
- Public URLs use `/music/:id` for better user understanding
- Internal code uses "Entry" terminology to match the Algolia data model
- All redirects properly handle the transition from `/beat/` to `/music/`
- Both `/music/[id]` and `/entry/[id]` routes are maintained but share implementation via `app/_shared/entry-page.tsx` to eliminate code duplication

### Code Deduplication (Jan 2025)

To prevent code duplication between the dual route structure, a shared implementation was created:

| File | Purpose | Notes |
|------|---------|-------|
| `app/_shared/entry-page.tsx` | Shared implementation for entry pages | Contains `generateEntryMetadata()` and `EntryPageComponent()` |
| `app/music/[id]/page.tsx` | Public music route wrapper | Imports and re-exports shared implementation as `MusicPage` |
| `app/entry/[id]/page.tsx` | Internal entry route wrapper | Imports and re-exports shared implementation as `EntryPage` |

This structure eliminates ~130 lines of duplicated code while maintaining both route endpoints.
