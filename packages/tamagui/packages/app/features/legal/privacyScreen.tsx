'use client'
import { H1, P } from 'app/design/typography'
import { Navbar } from 'app/ui/navbar/Navbar'
import { ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'app/design/safe-area-view'
import { YStack } from 'tamagui'

export default function PrivacyScreen() {
  return (
    <SafeAreaView backgroundColor="$black">
      <YStack maxHeight="100%" flex={1}>
        {Platform.OS === 'web' && <Navbar />}
        <ScrollView style={{ marginHorizontal: 'auto', maxWidth: 1280, flex: 1, padding: 32, paddingHorizontal: 24 }}>
          <H1 marginVertical="$4" fontSize="$4" color="$white1">PRIVACY POLICY</H1>
          <P color="$white1">
            This policy explains what we collect, why we collect it, and how we handle it across our web app (Next.js), APIs (Cloudflare Workers), storage (R2), search (Algolia), and blockchain operations (Stellar Soroban). By using Skyhitz, you consent to this policy.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">1. DATA WE COLLECT</P>
          <P color="$white1">
            Account data (email, optional display details), blockchain addresses (public keys), usage logs, device and basic analytics information. For paid flows we may collect limited payment metadata via Stripe (we do not store full card data).
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">2. HOW WE USE DATA</P>
          <P color="$white1">
            To authenticate you, render your feed and search, process on‑chain actions (invest/mine/claim), secure the service, comply with law, and improve features. We do not sell personal data.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">3. ON‑CHAIN TRANSPARENCY</P>
          <P color="$white1">
            Actions that interact with Stellar are public by nature. Your public address and transaction metadata are visible on‑chain. Do not reuse addresses if you want separation between contexts.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">4. STORAGE & RETENTION</P>
          <P color="$white1">
            We store media/metadata on R2 under content‑addressed keys. We keep account and operational logs as needed for security, debugging, and regulatory purposes, then delete or anonymize.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">5. SHARING</P>
          <P color="$white1">
            We share data with processors (Cloudflare, Algolia, Stripe, Postmark, Stellar infrastructure) strictly to provide the service. We may share minimal data to comply with legal requests.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">6. SECURITY</P>
          <P color="$white1">
            We use encryption in transit, hardened cloud infrastructure, and least‑privilege access. No system is perfectly secure; use strong passwords and protect your keys.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">7. YOUR RIGHTS</P>
          <P color="$white1">
            Depending on your jurisdiction, you may request access, correction, deletion, or portability of your data. Contact support@skyhitz.io.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">8. CHILDREN</P>
          <P color="$white1">
            Skyhitz is not intended for children under the age of majority. Do not use the service if you are under the minimum age where you live.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">9. CHANGES</P>
          <P color="$white1">
            We may update this policy. Material changes will be announced in‑app; continued use means you accept the updated policy.
          </P>

          <P marginVertical="$4" fontWeight="600" color="$white1">CONTACT</P>
          <P color="$white1">support@skyhitz.io</P>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  )
}
