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
            This website, the iOS and Android apps are operated by Skyhitz.
            Throughout the apps, the terms "we", "us" and "our" refer to Skyhitz.
            Skyhitz offers these apps, including all information, tools and
            services available from these apps to you, the user, conditioned upon
            your acceptance of all terms, conditions, policies and notices stated
            here.
          </P>
          <P className="text-white">
            By visiting our apps and/ or purchasing something from us, you engage
            in our "Service" and agree to be bound by the following terms and
            conditions ("Terms of Service", "Terms"), including those additional
            terms and conditions and policies referenced herein and/or available
            by hyperlink. These Terms of Service apply to all users of the apps,
            including without limitation users who are browsers, vendors,
            customers, merchants, and/ or contributors of content.
          </P>
          <P className="text-white">
            Please read these Terms of Service carefully before accessing or using
            our apps. By accessing or using any part of the apps, you agree to be
            bound by these Terms of Service. If you do not agree to all the terms
            and conditions of this agreement, then you may not access the apps or
            use any services. If these Terms of Service are considered an offer,
            acceptance is expressly limited to these Terms of Service.
          </P>
          <P className="text-white">
            Any new features or tools which are added to the current store shall
            also be subject to the Terms of Service. You can review the most
            current version of the Terms of Service at any time on this page. We
            reserve the right to update, change or replace any part of these Terms
            of Service by posting updates and/or changes to our website. It is
            your responsibility to check this page periodically for changes. Your
            continued use of or access to the website following the posting of any
            changes constitutes acceptance of those changes.
          </P>
          <P className="my-4 font-semibold text-white">SECTION 1 - ONLINE STORE TERMS</P>
          <P className="text-white">
            By agreeing to these Terms of Service, you represent that you are at
            least the age of majority in your state or province of residence, or
            that you are the age of majority in your state or province of
            residence and you have given us your consent to allow any of your
            minor dependents to use this site.
          </P>
          <P className="text-white">
            You may not use our products for any illegal or unauthorized purpose
            nor may you, in the use of the Service, violate any laws in your
            jurisdiction (including but not limited to copyright laws).
          </P>
          <P className="text-white">
            You must not transmit any worms or viruses or any code of a
            destructive nature.
          </P>
          <P className="text-white">
            A breach or violation of any of the Terms will result in an immediate
            termination of your Services.
          </P>
          <P className="my-4 font-semibold text-white">SECTION 2 - GENERAL CONDITIONS</P>
          <P className="text-white">
            We reserve the right to refuse service to anyone for any reason at any
            time.
          </P>
          <P className="text-white">
            You understand that your content (not including credit card
            information), may be transferred unencrypted and involve (a)
            transmissions over various networks; and (b) changes to conform and
            adapt to technical requirements of connecting networks or devices.
            Credit card information is always encrypted during transfer over
            networks.
          </P>
          <P className="text-white">
            You agree not to reproduce, duplicate, copy, sell, resell or exploit
            any portion of the Service, use of the Service, or access to the
            Service or any contact on the website through which the service is
            provided, without express written permission by us.
          </P>
          <P className="text-white">
            The headings used in this agreement are included for convenience only
            and will not limit or otherwise affect these Terms.
          </P>
          <P className="my-4 font-semibold text-white">
            SECTION 3 - ACCURACY, COMPLETENESS AND TIMELINESS OF INFORMATION
          </P>
          <P className="text-white">
            We are not responsible if information made available on this site is
            not accurate, complete or current. The material on this site is
            provided for general information only and should not be relied upon or
            used as the sole basis for making decisions without consulting
            primary, more accurate, more complete or more timely sources of
            information. Any reliance on the material on this site is at your own
            risk.
          </P>
          <P className="text-white">
            This site may contain certain historical information. Historical
            information, necessarily, is not current and is provided for your
            reference only. We reserve the right to modify the contents of this
            site at any time, but we have no obligation to update any information
            on our site. You agree that it is your responsibility to monitor
            changes to our site.
          </P>
          <P className="my-4 font-semibold text-white">
            SECTION 4 - MODIFICATIONS TO THE SERVICE AND PRICES
          </P>
          <P className="text-white">
            Prices for our products are subject to change without notice.
          </P>
          <P className="text-white">
            We reserve the right at any time to modify or discontinue the Service
            (or any part or content thereof) without notice at any time.
          </P>
          <P className="text-white">
            We shall not be liable to you or to any third-party for any
            modification, price change, suspension or discontinuance of the
            Service.
          </P>
          <P className="my-4 font-semibold text-white">
            SECTION 5 - PRODUCTS OR SERVICES
          </P>
          <P className="text-white">
            Certain products or services may be available exclusively online
            through the website. These products or services may have limited
            quantities and are subject to return or exchange only according to our
            Return Policy.
          </P>
          <P className="text-white">
            We have made every effort to display as accurately as possible the
            colors and images of our products that appear at the store. We cannot
            guarantee that your computer monitor's display of any color will be
            accurate.
          </P>
          <P className="text-white">
            We reserve the right, but are not obligated, to limit the sales of our
            products or Services to any person, geographic region or jurisdiction.
            We may exercise this right on a case-by-case basis. We reserve the
            right to limit the quantities of any products or services that we
            offer. All descriptions of products or product pricing are subject to
            change at anytime without notice, at the sole discretion of us. We
            reserve the right to discontinue any product at any time. Any offer
            for any product or service made on this site is void where prohibited.
          </P>
          <P className="text-white">
            We do not warrant that the quality of any products, services,
            information, or other material purchased or obtained by you will meet
            your expectations, or that any errors in the Service will be
            corrected.
          </P>
          <P className="my-4 font-semibold text-white">
            SECTION 6 - OPTIONAL TOOLS
          </P>
          <P className="text-white">
            We may provide you with access to third-party tools over which we
            neither monitor nor have any control nor input.
          </P>
          <P className="text-white">
            You acknowledge and agree that we provide access to such tools "as is"
            and "as available" without any warranties, representations or
            conditions of any kind and without any endorsement. We shall have no
            liability whatsoever arising from or relating to your use of optional
            third-party tools.
          </P>
          <P className="text-white">
            Any use by you of optional tools offered through the site is entirely
            at your own risk and discretion and you should ensure that you are
            familiar with and approve of the terms on which tools are provided by
            the relevant third-party provider(s).
          </P>
          <P className="text-white">
            We may also, in the future, offer new services and/or features through
            the website (including, the release of new tools and resources). Such
            new features and/or services shall also be subject to these Terms of
            Service.
          </P>
          <P className="my-4 font-semibold text-white">SECTION 7 - THIRD-PARTY LINKS</P>
          <P className="text-white">
            Certain content, products and services available via our Service may
            include materials from third-parties.
          </P>
          <P className="text-white">
            Third-party links on this site may direct you to third-party websites
            that are not affiliated with us. We are not responsible for examining
            or evaluating the content or accuracy and we do not warrant and will
            not have any liability or responsibility for any third-party materials
            or websites, or for any other materials, products, or services of
            third-parties.
          </P>
          <P className="text-white">
            We are not liable for any harm or damages related to the purchase or
            use of goods, services, resources, content, or any other transactions
            made in connection with any third-party websites. Please review
            carefully the third-party's policies and practices and make sure you
            understand them before you engage in any transaction. Complaints,
            claims, concerns, or questions regarding third-party products should
            be directed to the third-party.
          </P>
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
