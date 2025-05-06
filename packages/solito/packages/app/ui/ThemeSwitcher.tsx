'use client'
import { View, Pressable } from 'react-native'
import { P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'
import Moon from 'app/ui/icons/moon'
import Sun from 'app/ui/icons/sun'

export default function ThemeSwitcher() {
  const { isDark, toggleTheme, colors } = useTheme()

  return (
    <Pressable
      onPress={toggleTheme}
      className={`flex items-center justify-center rounded-full p-2 ${
        isDark ? 'bg-gray-800' : 'bg-gray-200'
      }`}
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
    >
      {isDark ? (
        <Moon stroke={colors.text} width={20} height={20} />
      ) : (
        <Sun stroke={colors.text} width={20} height={20} />
      )}
    </Pressable>
  )
}
