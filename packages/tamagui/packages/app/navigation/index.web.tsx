'use client'

import React, { PropsWithChildren } from 'react'
import NextLink from 'next/link'
import { useRouter as useNextRouter, usePathname as useNextPathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation'
import { Text } from 'tamagui'

export type LinkProps = React.ComponentProps<typeof NextLink>

export const Link = (props: LinkProps) => {
  return <NextLink {...props} />
}

export interface TextLinkProps extends Omit<LinkProps, 'children'>, PropsWithChildren {}

export const TextLink = ({ children, ...rest }: TextLinkProps) => {
  return (
    <NextLink {...rest}>
      <Text>{children}</Text>
    </NextLink>
  )
}

export const useRouter = () => useNextRouter()
export const usePathname = () => useNextPathname()
export const useSearchParams = () => useNextSearchParams()
export const useParams = <T extends Record<string, string>>() => useNextParams() as unknown as T


