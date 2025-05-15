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
| `/dashboard/beat/[id]` | `/beat/[id]` | |
| `/dashboard/search` | `/search` | |

The `/dashboard` directory and all its components have been removed, with any necessary functionality moved to the root features directory.
