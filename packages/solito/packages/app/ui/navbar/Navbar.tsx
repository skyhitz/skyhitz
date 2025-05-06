'use client'
import { View, TextInput, Pressable, Text } from 'react-native'
import { H1, P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'
import { Link } from 'solito/link'
import ThemeSwitcher from '../ThemeSwitcher'
import Search from 'app/ui/icons/search'
import { SkyhitzLogo } from 'app/ui/logo'

type NavbarProps = {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const { colors } = useTheme()
  
  return (
    <View 
      className={`w-full flex-row items-center justify-between p-3 ${className || ''}`}
      style={{ backgroundColor: colors.background }}
    >
      {/* Logo */}
      <Link href="/" viewProps={{ className: "flex flex-row" }}>
        <View className="flex flex-row items-center justify-start">
          <View className="flex min-h-[2.25rem] flex-row items-center">
            <SkyhitzLogo id="navbar" />
            <Text className="font-raleway pl-4 text-sm tracking-[12px] text-gray-600 sm:text-lg">
              SKYHITZ
            </Text>
          </View>
        </View>
      </Link>
      
      {/* Search bar */}
      <View className="mx-4 flex-1 max-w-xl">
        <View className="flex flex-row items-center rounded-full border border-gray-800 px-4 py-2">
          <Search width="20" height="20" stroke={colors.textSecondary} />
          <TextInput
            placeholder="Search beats and artists..."
            placeholderTextColor={colors.textSecondary}
            className="ml-2 flex-1"
            style={{ color: colors.text }}
          />
        </View>
      </View>
      
      {/* Theme switcher */}
      <ThemeSwitcher />
    </View>
  )
}
