export type ErrorType = {
  name?: string
  message: string
  status?: number | string
}

export interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  slug: string
  publishedAt: number
  imageUrl: string
  author: string
  tag: string
  publishedAtTimestamp: number
}

export interface IconProps {
  size?: number
  color?: string
  className?: string
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

export type Feature = {
  name: string
  desc: string
  icon: (props: IconProps) => JSX.Element
}

// Authentication Form Types
export type SignInForm = {
  usernameOrEmail: string
}

export type SignUpForm = {
  username: string
  displayedName: string
  email: string
}

export interface FeaturedProps {
  title: string
  subtitle: string
  features: Feature[]
  imgUrl: string
}

export interface FaqProps {
  title: string
  faqs: {
    question: string
    answer: string
  }[]
}

export type HomePageProps = {
  posts: Post[]
  header: HeroProps
  cta: CtaProps
  featured: FeaturedProps
  faq: FaqProps
  landing?: boolean
}
