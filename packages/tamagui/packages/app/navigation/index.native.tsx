'use client'

import React, { PropsWithChildren } from 'react'
import { Link as ExpoLink, useRouter as useExpoRouter, usePathname as useExpoPathname, useLocalSearchParams, useGlobalSearchParams } from 'expo-router'
import { Text } from 'tamagui'

export type LinkProps = React.ComponentProps<typeof ExpoLink>

export const Link = (props: LinkProps) => {
  return <ExpoLink {...props} />
}

export interface TextLinkProps extends Omit<LinkProps, 'children'>, PropsWithChildren {}

export const TextLink = ({ children, ...rest }: TextLinkProps) => {
  return (
    <ExpoLink {...rest}>
      <Text>{children}</Text>
    </ExpoLink>
  )
}

export const useRouter = () => {
  return useExpoRouter()
}

export const usePathname = () => {
  return useExpoPathname()
}

// Provide a minimal compatible API with .get(name)
function toSearchParamsObject(params: Record<string, string | string[] | undefined>) {
  return {
    get(name: string): string | null {
      const value = params[name]
      if (Array.isArray(value)) return (value[0] as string) ?? null
      return (value as string) ?? null
    },
  }
}

export const useSearchParams = () => {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>
  return toSearchParamsObject(params)
}

export const useParams = <T extends Record<string, string | string[]>>() => {
  return useLocalSearchParams() as unknown as T
}

export const useGlobalParams = <T extends Record<string, string | string[]>>() => {
  return useGlobalSearchParams() as unknown as T
}


