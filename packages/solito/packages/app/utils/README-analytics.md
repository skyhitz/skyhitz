# Google Analytics Event Tracking

This implementation provides comprehensive Google Analytics event tracking for Skyhitz across web and mobile platforms.

## Setup

### 1. Cloudflare Zaraz Configuration

Google Analytics is managed by **Cloudflare Zaraz** on skyhitz.io:

1. **Zaraz Dashboard**: GA4 is already configured in Cloudflare dashboard
2. **Automatic Script Loading**: Zaraz handles loading the Google Analytics script
3. **No Manual Setup Required**: The GA script is automatically injected by Cloudflare

### 2. Environment Variables

The configuration uses Next.js environment variables (must be prefixed with `NEXT_PUBLIC_`):

```bash
# .env or .env.local
# Disable GA (enabled by default)
NEXT_PUBLIC_DISABLE_GA=true

# Enable debug mode (disabled by default)
NEXT_PUBLIC_GA_DEBUG=true
```

**Default Behavior:**
- **Development** (`yarn solito:dev`): GA is **DISABLED** by default (set `NEXT_PUBLIC_DISABLE_GA=true` in your .env)
- **Production** (deployed): GA is **ENABLED** by default (don't set `NEXT_PUBLIC_DISABLE_GA` or set it to `false`)

## Tracked Events

The following events are automatically tracked:

### Authentication Events
- **signed_in**: When a user successfully signs in
- **signed_out**: When a user signs out
- **sign_up**: When a user successfully creates a new account

### Content Interaction Events
- **stream**: When a user plays/streams a track
- **like**: When a user likes a track
- **download**: When a user downloads a track
- **invest**: When a user invests in a track
- **mine**: When a user mines an external track
- **top_up**: When a user completes a top-up purchase

## Event Data

Each event includes relevant metadata:

```typescript
interface AnalyticsEventParams {
  event_name: AnalyticsEvent
  entry_id?: string        // Track/entry identifier
  entry_title?: string     // Track title
  entry_artist?: string    // Artist name
  amount?: number         // Investment amount (for invest events)
  currency?: string       // Currency (default: XLM)
  user_id?: string        // User identifier
}
```

## Usage

### Automatic Tracking

Events are automatically tracked when users perform actions:

- **Stream**: Tracked in `usePlayback` hook when loading entries
- **Like**: Tracked in `LikeButton` component when liking tracks
- **Download**: Tracked in `DownloadBtn` component when downloading
- **Invest**: Tracked in `InvestSection` component when investing
- **Mine**: Tracked in search results when mining external tracks
- **Top Up**: Tracked in checkout form when payment is confirmed
- **Sign In/Out**: Tracked in authentication flows
- **Sign Up**: Tracked in sign-up form when account creation succeeds

### Manual Tracking

You can also manually track events:

```typescript
import { trackEvent, trackInvest, trackStream } from 'app/utils/analytics'

// Track a custom event
trackEvent({
  event_name: 'custom_action',
  custom_param: 'value'
})

// Track specific events with helper functions
trackStream('entry-id', 'Track Title', 'Artist Name')
trackInvest('entry-id', 10.5, 'XLM', 'Track Title', 'Artist Name')
trackSignUp('user-id')
trackTopUp('user-id', 'checkout', 50.00) // amount in USD
```

## Platform Support

### Web (Next.js)
- Uses Google Analytics 4 (gtag) via Cloudflare Zaraz
- GA script automatically loaded by Cloudflare
- Events sent directly to Google Analytics

### Mobile (React Native)
- Currently logs events for debugging
- Ready for integration with Firebase Analytics or other mobile analytics services
- Events can be forwarded to your backend for processing

## Debugging

In development mode, events are logged to the console instead of being sent to Google Analytics. This allows you to verify that events are being tracked correctly.

## Privacy Considerations

- No personally identifiable information (PII) is tracked
- User IDs are anonymized identifiers
- Track metadata is limited to public information (title, artist)
- Analytics can be disabled by setting `GA_CONFIG.ENABLED = false`

## Customization

### Adding New Events

1. Add the event name to the `AnalyticsEvent` type in `analytics.ts`
2. Add a mapping in the `mapEventName` function
3. Create a helper function if needed
4. Integrate tracking calls in the appropriate components

### Modifying Event Data

Update the `AnalyticsEventParams` interface to include additional parameters as needed.

## Testing

To test analytics tracking:

1. Set `GA_CONFIG.DEBUG = true` in development
2. Check browser console for logged events
3. Use Google Analytics Real-Time reports to verify events in production
4. Test on both web and mobile platforms
