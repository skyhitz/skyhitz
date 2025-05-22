'use client'
import { Pressable } from 'react-native'
import { useTheme } from 'app/state/theme/useTheme'
import Moon from 'app/ui/icons/moon'
import Sun from 'app/ui/icons/sun'

export default function ThemeSwitcher() {
  const { isDark, toggleTheme, theme } = useTheme()

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
        <Moon className="text-[--text-color]" width={20} height={20} />
      ) : (
        <Sun className="text-[--text-color]" width={20} height={20} />
      )}
    </Pressable>
  )
}
