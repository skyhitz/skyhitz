'use client'
import { H1, P } from 'app/design/typography'
import Navbar from 'app/ui/navbar'
import { SafeAreaView, ScrollView, Platform } from 'react-native'

export default function PrivacyScreen() {
  return (
    <SafeAreaView className="flex max-h-full flex-1">
      {Platform.OS === 'web' && <Navbar />}
      <ScrollView className="mx-auto max-w-7xl flex-1 p-8 px-6 lg:px-8">
        <H1 className="my-4 text-base">PRIVACY POLICY</H1>
        <P className="my-4 font-semibold">
          SECTION 1 - WHAT DO WE DO WITH YOUR INFORMATION?
        </P>
        <P>
          When you purchase something from our store, as part of the buying and
          selling process, we collect the personal information you give us such
          as your name, address and email address.
        </P>
        <P>
          When you browse our store, we also automatically receive your
          computer’s internet protocol (IP) address in order to provide us with
          information that helps us learn about your browser and operating
          system.
        </P>
        <P>
          Email marketing (if applicable): With your permission, we may send you
          emails about our services, new products and other updates.
        </P>
        <P className="my-4 font-semibold">SECTION 2 - CONSENT</P>
        <P>How do you get my consent?</P>
        <P>
          When you provide us with personal information to complete a
          transaction, verify your credit card, place an order, arrange for a
          delivery or return a purchase, we imply that you consent to our
          collecting it and using it for that specific reason only.
        </P>
        <P>
          If we ask for your personal information for a secondary reason, like
          marketing, we will either ask you directly for your expressed consent,
          or provide you with an opportunity to say no.
        </P>
        <P>How do I withdraw my consent?</P>
        <P>
          If after you opt-in, you change your mind, you may withdraw your
          consent for us to contact you, for the continued collection, use or
          disclosure of your information, at anytime, by contacting us at
          support@skyhitz.io
        </P>
        <P className="my-4 font-semibold">SECTION 3 - DISCLOSURE</P>
        <P>
          We may disclose your personal information if we are required by law to
          do so or if you violate our Terms of Service.
        </P>
        <P className="my-4 font-semibold">SECTION 4 - STRIPE</P>
        <P>
          Our payments are powered by Stripe Inc. They provide us with the
          platform that allows us to sell our services to you.
        </P>
        <P>
          Your data is stored through Stripe’s data storage, databases and the
          general Stripe application. They store your data on a secure server
          behind a firewall.
        </P>
        <P>Payment:</P>
        <P>
          If you choose a direct payment gateway to complete your purchase, then
          Stripe stores your credit card data. It is encrypted through the
          Payment Card Industry Data Security Standard (PCI-DSS). Your purchase
          transaction data is stored only as long as is necessary to complete
          your purchase transaction. After that is complete, your purchase
          transaction information is deleted.
        </P>
        <P>
          All direct payment gateways adhere to the standards set by PCI-DSS as
          managed by the PCI Security Standards Council, which is a joint effort
          of brands like Visa, MasterCard, American Express and Discover.
        </P>
        <P>
          PCI-DSS requirements help ensure the secure handling of credit card
          information by our store and its service providers.
        </P>
        <P>
          For more insight, you may also want to read Stripe’s Terms of Service
          or Privacy Statement.
        </P>
        <P className="my-4 font-semibold">SECTION 5 - THIRD-PARTY SERVICES</P>
        <P>
          In general, the third-party providers used by us will only collect,
          use and disclose your information to the extent necessary to allow
          them to perform the services they provide to us.
        </P>
        <P>
          However, certain third-party service providers, such as payment
          gateways and other payment transaction processors, have their own
          privacy policies in respect to the information we are required to
          provide to them for your purchase-related transactions.
        </P>
        <P>
          For these providers, we recommend that you read their privacy policies
          so you can understand the manner in which your personal information
          will be handled by these providers.
        </P>
        <P>
          In particular, remember that certain providers may be located in or
          have facilities that are located in a different jurisdiction than
          either you or us. So if you elect to proceed with a transaction that
          involves the services of a third-party service provider, then your
          information may become subject to the laws of the jurisdiction(s) in
          which that service provider or its facilities are located.
        </P>
        <P>
          As an example, if you are located in Canada and your transaction is
          processed by a payment gateway located in the United States, then your
          personal information used in completing that transaction may be
          subject to disclosure under United States legislation, including the
          Patriot Act.
        </P>
        <P>
          Once you leave our store’s website or are redirected to a third-party
          website or application, you are no longer governed by this Privacy
          Policy or our website’s Terms of Service. Links When you click on
          links on our store, they may direct you away from our site. We are not
          responsible for the privacy practices of other sites and encourage you
          to read their privacy statements.
        </P>
        <P className="my-4 font-semibold">SECTION 6 - SECURITY</P>
        <P>
          To protect your personal information, we take reasonable precautions
          and follow industry best practices to make sure it is not
          inappropriately lost, misused, accessed, disclosed, altered or
          destroyed.
        </P>
        <P>
          If you provide us with your credit card information, the information
          is encrypted using secure socket layer technology (SSL) and stored
          with a AES-256 encryption. Although no method of transmission over the
          Internet or electronic storage is 100% secure, we follow all PCI-DSS
          requirements and implement additional generally accepted industry
          standards.
        </P>
        <P className="my-4 font-semibold">SECTION 6 - COOKIES</P>
        <P>
          We use various technologies to collect and store information when you
          visit our services, and this may include using cookies or similar
          technologies to identify your browser or device. We also use these
          technologies to collect and store information when you interact with
          services we offer to our partners, such as advertising services. We
          use google analytics which helps businesses and site owners analyze
          the traffic to their websites and apps.
        </P>
        <P className="my-4 font-semibold">SECTION 7 - AGE OF CONSENT</P>
        <P>
          By using this site or any of our apps, you represent that you are at
          least the age of majority in your state or province of residence, or
          that you are the age of majority in your state or province of
          residence and you have given us your consent to allow any of your
          minor dependents to use this site.
        </P>
        <P className="my-4 font-semibold">
          SECTION 8 - CHANGES TO THIS PRIVACY POLICY
        </P>
        <P>
          We reserve the right to modify this privacy policy at any time, so
          please review it frequently. Changes and clarifications will take
          effect immediately upon their posting on the website. If we make
          material changes to this policy, we will notify you here that it has
          been updated, so that you are aware of what information we collect,
          how we use it, and under what circumstances, if any, we use and/or
          disclose it.
        </P>
        <P>
          If our apps are acquired or merged with another company, your
          information may be transferred to the new owners so that we may
          continue to sell services to you.
        </P>
        <P className="my-4 font-semibold">QUESTIONS AND CONTACT INFORMATION</P>
        <P>
          If you would like to: access, correct, amend or delete any personal
          information we have about you, register a complaint, or simply want
          more information contact our Privacy Compliance Officer at
          support@skyhitz.io.
        </P>
      </ScrollView>
    </SafeAreaView>
  )
}
