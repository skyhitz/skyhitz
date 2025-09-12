'use client'
import { H1, P } from 'app/design/typography'
import { Navbar } from 'app/ui/navbar/Navbar'
import { View, ScrollView, Platform } from 'react-native'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="bg-black">
      <View className="flex max-h-full flex-1">
        {Platform.OS === 'web' && <Navbar />}
        <ScrollView className="mx-auto max-w-7xl flex-1 p-8 px-6 lg:px-8">
          <H1 className="my-4 text-base text-white">PRIVACY POLICY</H1>
          <P className="text-white">
            This policy explains what we collect, why we collect it, and how we handle it across our web app (Next.js), APIs (Cloudflare Workers), storage (R2), search (Algolia), and blockchain operations (Stellar Soroban). By using Skyhitz, you consent to this policy.
          </P>

          <P className="my-4 font-semibold text-white">1. DATA WE COLLECT</P>
          <P className="text-white">
            Account data (email, optional display details), blockchain addresses (public keys), usage logs, device and basic analytics information. For paid flows we may collect limited payment metadata via Stripe (we do not store full card data).
          </P>

          <P className="my-4 font-semibold text-white">2. HOW WE USE DATA</P>
          <P className="text-white">
            To authenticate you, render your feed and search, process on‑chain actions (invest/mine/claim), secure the service, comply with law, and improve features. We do not sell personal data.
          </P>

          <P className="my-4 font-semibold text-white">3. ON‑CHAIN TRANSPARENCY</P>
          <P className="text-white">
            Actions that interact with Stellar are public by nature. Your public address and transaction metadata are visible on‑chain. Do not reuse addresses if you want separation between contexts.
          </P>

          <P className="my-4 font-semibold text-white">4. STORAGE & RETENTION</P>
          <P className="text-white">
            We store media/metadata on R2 under content‑addressed keys. We keep account and operational logs as needed for security, debugging, and regulatory purposes, then delete or anonymize.
          </P>

          <P className="my-4 font-semibold text-white">5. SHARING</P>
          <P className="text-white">
            We share data with processors (Cloudflare, Algolia, Stripe, Postmark, Stellar infrastructure) strictly to provide the service. We may share minimal data to comply with legal requests.
          </P>

          <P className="my-4 font-semibold text-white">6. SECURITY</P>
          <P className="text-white">
            We use encryption in transit, hardened cloud infrastructure, and least‑privilege access. No system is perfectly secure; use strong passwords and protect your keys.
          </P>

          <P className="my-4 font-semibold text-white">7. YOUR RIGHTS</P>
          <P className="text-white">
            Depending on your jurisdiction, you may request access, correction, deletion, or portability of your data. Contact support@skyhitz.io.
          </P>

          <P className="my-4 font-semibold text-white">8. CHILDREN</P>
          <P className="text-white">
            Skyhitz is not intended for children under the age of majority. Do not use the service if you are under the minimum age where you live.
          </P>

          <P className="my-4 font-semibold text-white">9. CHANGES</P>
          <P className="text-white">
            We may update this policy. Material changes will be announced in‑app; continued use means you accept the updated policy.
          </P>

          <P className="my-4 font-semibold text-white">CONTACT</P>
          <P className="text-white">support@skyhitz.io</P>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
