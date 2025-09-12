'use client'
import { Navbar } from 'app/ui/navbar/Navbar'
import { View, ScrollView, Platform } from 'react-native'
import { H1, P } from 'app/design/typography'
import { SafeAreaView } from 'app/design/safe-area-view'

export default function TermsScreen() {
  return (
    <SafeAreaView className="bg-black">
      <View className="flex max-h-full flex-1">
        {Platform.OS === 'web' && <Navbar />}
        <ScrollView className="mx-auto max-w-7xl flex-1 p-8 px-6 lg:px-8">
          <H1 className="my-4 text-base text-white">TERMS OF USE</H1>
          <P className="my-4 font-semibold text-white">OVERVIEW</P>
          <P className="text-white">
            Skyhitz is a music platform that lets users discover and stream tracks, and optionally spend or invest lumens (XLM) against on‑chain entries to earn equity shares. Our backend runs on Cloudflare Workers; on‑chain logic is implemented with Stellar Soroban smart contracts. Media and metadata are stored on Cloudflare R2; search runs on Algolia.
          </P>
          <P className="text-white">
            By accessing the apps or using any feature (search, stream, like, download, mine, invest, claim earnings), you agree to these Terms. If you do not agree, do not use Skyhitz.
          </P>

          <P className="my-4 font-semibold text-white">1. ACCOUNTS & ELIGIBILITY</P>
          <P className="text-white">
            You must be at least the age of majority where you live. Signing in creates an in‑app Stellar account (keypair). We may refuse or suspend accounts at our discretion.
          </P>

          <P className="my-4 font-semibold text-white">2. NON‑CUSTODIAL & ON‑CHAIN FINALITY</P>
          <P className="text-white">
            Transactions are executed on Stellar. Submissions to the network are irreversible once confirmed. Values are shown in XLM; you are responsible for fees and taxes. We do not custody user funds beyond transactions in flight.
          </P>

          <P className="my-4 font-semibold text-white">3. ACTIONS & ECONOMICS</P>
          <P className="text-white">
            (a) Micro‑spends (≤ 0.3 XLM per call) — like, download, stream completion — increase contract escrow only; NO shares are granted.
          </P>
          <P className="text-white">
            (b) Invest (> 0.3 XLM per call) — increases escrow and TVL; grants equity shares proportional to the stroops invested. Ownership is dilutive: your percentage = shares / tvl and may change as others invest.
          </P>
          <P className="text-white">
            (c) Mine — a 1.0 XLM operation that pins media/metadata, then performs two contract invests (an escrow init and an equity invest) and a fee payment to the admin, per our APR partition logic.
          </P>
          <P className="text-white">
            (d) Claim earnings — available when escrow exceeds tvl. The claim transfers your pro‑rata earnings and updates on‑chain accounting.
          </P>

          <P className="my-4 font-semibold text-white">4. CONTENT, RIGHTS & CREATOR WORKFLOWS</P>
          <P className="text-white">
            You must have rights to anything you upload or request us to pin. External search previews link to third‑party sources under their own licenses.
          </P>
          <P className="text-white">
            Creator Claim (roadmap): after manual verification, creators may claim an entry and receive 25% initial shares, boosted to 50% upon post‑claim promotion that meets criteria. Creator Takedown (roadmap): following verification and due diligence, entries can be removed; TVL is returned to users pro‑rata.
          </P>
          <P className="text-white">
            Internal Mine/Mint: for exclusive releases with us, initial share split is agreed in writing. To propose, email ar@skyhitz.io.
          </P>

          <P className="my-4 font-semibold text-white">5. FEES & PRICING</P>
          <P className="text-white">
            Fees include network fees and Skyhitz commissions described in‑app (e.g., the fee paid during Mine). We may change fees prospectively.
          </P>

          <P className="my-4 font-semibold text-white">6. ACCEPTABLE USE</P>
          <P className="text-white">
            Do not infringe IP; do not upload illegal content; do not attempt to attack, scrape, or disrupt the service; do not engage in market manipulation or deceptive behavior.
          </P>

          <P className="my-4 font-semibold text-white">7. RISK DISCLOSURE & NO ADVICE</P>
          <P className="text-white">
            Digital assets are volatile and risky. Nothing on Skyhitz is investment, legal, or tax advice. You are solely responsible for your decisions.
          </P>

          <P className="my-4 font-semibold text-white">8. THIRD‑PARTY SERVICES</P>
          <P className="text-white">
            We integrate with Stellar, Cloudflare (Workers/R2/Pages), Algolia, Stripe, Postmark, and others. Each provider’s terms and privacy practices apply.
          </P>

          <P className="my-4 font-semibold text-white">9. DISCLAIMERS & LIMITATION OF LIABILITY</P>
          <P className="text-white">
            The service is provided “as is”. To the fullest extent permitted by law, Skyhitz disclaims warranties and will not be liable for indirect, incidental, special, consequential, or exemplary damages. Our aggregate liability will not exceed the amounts you paid to us in the 12 months before the claim.
          </P>

          <P className="my-4 font-semibold text-white">10. CHANGES</P>
          <P className="text-white">
            We may update these Terms from time to time. Material changes will be announced in‑app; continued use constitutes acceptance.
          </P>

          <P className="my-4 font-semibold text-white">11. CONTACT</P>
          <P className="text-white">Questions: support@skyhitz.io</P>
          <P className="my-4 font-semibold text-white">
            SECTION 8 - USER COMMENTS, FEEDBACK AND OTHER SUBMISSIONS
          </P>
          <P className="text-white">
            If, at our request, you send certain specific submissions (for example
            contest entries) or without a request from us you send creative ideas,
            suggestions, proposals, plans, or other materials, whether online, by
            email, by postal mail, or otherwise (collectively, 'comments'), you
            agree that we may, at any time, without restriction, edit, copy,
            publish, distribute, translate and otherwise use in any medium any
            comments that you forward to us. We are and shall be under no
            obligation (1) to maintain any comments in confidence; (2) to pay
            compensation for any comments; or (3) to respond to any comments.
          </P>
          <P className="text-white">
            We may, but have no obligation to, monitor, edit or remove content
            that we determine in our sole discretion are unlawful, offensive,
            threatening, libelous, defamatory, pornographic, obscene or otherwise
            objectionable or violates any party's intellectual property or these
            Terms of Service.
          </P>
          <P className="text-white">
            You agree that your comments will not violate any right of any
            third-party, including copyright, trademark, privacy, personality or
            other personal or proprietary right. You further agree that your
            comments will not contain libelous or otherwise unlawful, abusive or
            obscene material, or contain any computer virus or other malware that
            could in any way affect the operation of the Service or any related
            website. You may not use a false e-mail address, pretend to be someone
            other than yourself, or otherwise mislead us or third-parties as to
            the origin of any comments. You are solely responsible for any
            comments you make and their accuracy. We take no responsibility and
            assume no liability for any comments posted by you or any third-party.
          </P>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}
