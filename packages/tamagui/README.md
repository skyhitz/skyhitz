# Skyhitz Tamagui App

> **Status**: ✅ Migration Complete - Ready for Testing & Component Conversion

Modern music investment platform built with Tamagui, enabling seamless cross-platform development (Web + iOS + Android) with proper SSR support.

## 🚀 Quick Start

### Installation

```bash
cd packages/tamagui
yarn install
```

### Development

**Web (Next.js):**
```bash
yarn web
# Opens http://localhost:3000
```

**Native (Expo Go):**
```bash
yarn native
# Scan QR code with Expo Go app
```

**iOS Development Build:**
```bash
cd apps/expo
yarn ios
```

**Android Development Build:**
```bash
cd apps/expo
yarn android
```

## 📁 Project Structure

```
tamagui/
├── apps/
│   ├── expo/          # Native app (Expo Router)
│   └── next/          # Web app (Next.js 15 + App Router)
│
└── packages/
    ├── app/           # Shared business logic & features
    ├── config/        # Tamagui configuration
    └── ui/            # Shared UI components
```

## 🎯 Tech Stack

- **UI Framework**: Tamagui (universal design system)
- **Web**: Next.js 15 with App Router
- **Native**: Expo with Expo Router
- **State**: Zustand
- **Data Fetching**: SWR + Apollo Client (GraphQL)
- **Search**: Algolia
- **Payments**: Stripe
- **Blockchain**: Stellar (Soroban smart contracts)
- **Forms**: Formik + Yup
- **Storage**: Expo SecureStore / Web Storage

## 📦 Key Features

- ✅ Music streaming & discovery
- ✅ Blockchain-based music investment
- ✅ User authentication (email + wallet)
- ✅ Search (Algolia)
- ✅ User profiles & collections
- ✅ Music player (mini & full-screen)
- ✅ Stripe payments for XLM top-up
- ✅ Blog & content pages
- ✅ Dark/light theme support

## 🔧 Configuration

### Environment Variables

Create `.env` files in:
- `apps/next/.env.local`
- `apps/expo/.env`

Required variables:
```env
NEXT_PUBLIC_GRAPHQL_ENDPOINT=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### Theme Customization

Edit `packages/config/src/tamagui.config.ts` to customize:
- Colors
- Fonts  
- Spacing
- Tokens

## 📝 Development Workflow

### Adding a New Feature

1. Create feature in `packages/app/features/my-feature/`
2. Add route in `apps/next/app/my-feature/page.tsx`
3. Add route in `apps/expo/app/my-feature.tsx`
4. Export from `packages/app/index.ts`

### Creating a Component

Use Tamagui primitives:
```tsx
import { YStack, Text, Button } from 'tamagui'

export function MyComponent() {
  return (
    <YStack padding="$4" backgroundColor="$background">
      <Text fontSize="$6" fontWeight="bold">
        Hello Tamagui
      </Text>
      <Button onPress={() => {}}>
        Click Me
      </Button>
    </YStack>
  )
}
```

## 🐛 Known Issues

1. **Component Conversion**: UI components still use NativeWind syntax, need gradual conversion to Tamagui components
2. **Build Process**: App package build currently skipped, needs TypeScript fixes for production
3. **Theme System**: Need to fully integrate Tamagui theme tokens with existing CSS variables

## 🧪 Testing

```bash
# Run tests
yarn test

# Run tests in watch mode
yarn test:watch
```

## 📚 Documentation

- [Migration Guide](./MIGRATION_COMPLETE.md)
- [Tamagui Docs](https://tamagui.dev)
- [Expo Router Docs](https://docs.expo.dev/router/)
- [Next.js Docs](https://nextjs.org/docs)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test on web and native
4. Submit PR

## 📄 License

Proprietary - Skyhitz Inc.

---

**Migration completed by AI Assistant** 🤖
