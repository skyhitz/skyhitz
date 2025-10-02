'use client'
import { useTheme } from 'app/state/theme/useTheme'
import { Moon, Sun } from '@tamagui/lucide-icons'
import { Button } from 'tamagui'

export default function ThemeSwitcher() {
  const { isDark, toggleTheme, theme } = useTheme()

  return (
    <Button
      onPress={toggleTheme}
      alignItems="center"
      justifyContent="center"
      borderRadius="$10"
      padding="$2"
      backgroundColor={isDark ? '$gray8' : '$gray3'}
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
    >
      {isDark ? (
        <Moon color="$color12" size={20} />
      ) : (
        <Sun color="$color12" size={20} />
      )}
    </Button>
  )
}
