import { Entry, UpdateUserMutationVariables } from 'app/api/graphql'

export type PlaybackState =
  | 'LOADING'
  | 'FALLBACK'
  | 'PLAYING'
  | 'PAUSED'
  | 'SEEKING'
  | 'IDLE'
  | 'ERROR'

export type SignUpForm = {
  username: string
  displayName: string
  email: string
  publicKey?: string
}
export type SignInForm = {
  usernameOrEmail: string
}
export type ErrorType = {
  name?: string
  message: string
  status?: number | string
}

export type IconProps = {
  color?: string
  size?: number
  className?: string
}
export type MintForm = {
  artist: string
  title: string
  description: string
  availableForSale: boolean
  price?: string
  equityForSale?: number
}

export type CreateOfferForm = {
  price?: string
  equityForSale?: number
}

export type WithdrawForm = {
  address: string
  amount: number
}

export type ChangeImage = {
  blob?: Blob
  url: string
}

export type MediaFileInfo =
  | {
      image: true
      uri: string
      width: number
      height: number
    }
  | { image: false; uri: string; mimeType: string }

export type Maybe<T> = T | null | undefined

export type EditProfileForm = Omit<
  UpdateUserMutationVariables,
  'avatarUrl' | 'backgroundUrl'
>

export type Offer = {
  id: number
  seller: string
  selling:
    | {
        asset_type: 'native'
      }
    | {
        asset_type: 'credit_alphanum12' | 'credit_alphanum4'
        asset_code: string
        asset_issuer: string
      }
  buying:
    | {
        asset_type: 'native'
      }
    | {
        asset_type: 'credit_alphanum12' | 'credit_alphanum4'
        asset_code: string
        asset_issuer: string
      }
  // The amount of selling that the account making this offer is willing to sell.
  amount: string
  // How many units of buying it takes to get 1 unit of selling. A number representing the decimal form of price_r.
  price: string
}

export type EnrichedEntry = Entry & { offer: Offer }

export type Post = {
  title: string
  content: string
  date: string
  id: string
  imageUrl: string
  tag: string
  slug: string
  publishedAtTimestamp: number
}

export type HeroProps = {
  title: string
  desc: string
}

export type CtaProps = {
  title: string
  subtitle: string
  cta: string
  desc: string
}

export type HomePageProps = {
  posts: Post[]
  header: HeroProps
  cta: CtaProps
  featured: FeaturedProps
  faq: FaqProps
  landing?: boolean
}

type Feature = {
  name: string
  desc: string
  icon: ({
    size,
    color,
  }: {
    size?: number | undefined
    color?: string | undefined
  }) => JSX.Element
}

export type FeaturedProps = {
  title: string
  subtitle: string
  features: Feature[]
  imgUrl: string
}

type Faq = {
  question: string
  answer: string
}

export type FaqProps = {
  title: string
  faqs: Faq[]
}

type FooterSection = {
  title: string
  links: { name: string; href: string }[]
}

export type FooterProps = {
  companyName: string
  sections: FooterSection[]
}
