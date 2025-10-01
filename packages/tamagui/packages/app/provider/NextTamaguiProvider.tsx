'use client'

import '@tamagui/core/reset.css'
import '@tamagui/font-inter/css/400.css'
import '@tamagui/font-inter/css/700.css'
import { ReactNode } from 'react'
import { StyleSheet } from 'react-native'
import { useServerInsertedHTML } from 'next/navigation'
import { TamaguiProvider, TamaguiProviderProps } from 'tamagui'

export function NextTamaguiProvider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { children: ReactNode }) {
  useServerInsertedHTML(() => {
    // @ts-ignore
    const rnwStyle = StyleSheet.getSheet()
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: rnwStyle.textContent }} id={rnwStyle.id} />
        <style
          dangerouslySetInnerHTML={{
            __html: `html, body { font-family: var(--font-body); }`,
          }}
        />
      </>
    )
  })

  return (
    <TamaguiProvider disableInjectCSS disableRootThemeClass defaultTheme="light" {...rest}>
      {children}
    </TamaguiProvider>
  )
}

