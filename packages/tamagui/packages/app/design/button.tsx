import { Button as TamaguiButton, Spinner, Text, XStack } from 'tamagui'
import { ReactElement } from 'react'

export interface IconProps {
  color?: string
  size?: number
}

type Props = {
  loading?: boolean
  text: string
  onPress: (e?: any) => void
  size?: 'default' | 'large' | 'small'
  variant?: 'primary' | 'secondary' | 'white' | 'text'
  icon?: (_props: IconProps) => ReactElement
  iconProps?: IconProps
  disabled?: boolean
  onDisabledPress?: () => void
}

const sizeConfig = {
  small: { px: '$2', py: '$2', minWidth: 80, fontSize: '$2' },
  default: { px: '$5', py: '$3', minWidth: 160, fontSize: '$3' },
  large: { px: '$10', py: '$3', minWidth: 288, fontSize: '$4' },
}

const variantConfig = {
  primary: { bg: '$blue9', color: '$white1', pressStyle: { bg: '$blue10' } },
  secondary: { bg: '$color9', color: '$white1', pressStyle: { bg: '$color10' } },
  white: { bg: '$white1', color: '$black12', pressStyle: { bg: '$color2' } },
  text: { bg: 'transparent', color: '$color12', pressStyle: { opacity: 0.8 } },
}

export const Button = ({
  loading = false,
  text,
  onPress,
  size = 'default',
  variant = 'primary',
  icon,
  iconProps,
  disabled = false,
  onDisabledPress,
}: Props) => {
  const sizeProps = sizeConfig[size]
  const variantProps = variantConfig[variant]

  const defaultIconProps = {
    color: disabled ? '#9CA3AF' : '#FFFFFF',
    size: 24,
  }

  return (
    <TamaguiButton
      {...sizeProps}
      backgroundColor={variantProps.bg}
      color={variantProps.color}
      pressStyle={variantProps.pressStyle}
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
      borderRadius="$3"
      fontWeight="600"
      letterSpacing={1}
      onPress={(e) => {
        if (disabled && onDisabledPress) {
          onDisabledPress()
        } else if (!disabled) {
          onPress(e)
        }
      }}
      disabled={disabled}
    >
      {loading ? (
        <XStack minHeight={24} ai="center" jc="center">
          <Spinner size="small" color="$white1" />
        </XStack>
      ) : (
        <XStack gap="$2" ai="center" jc="center">
          <Text
            color={disabled ? '$white1' : variantProps.color}
            fontSize={sizeProps.fontSize}
            fontWeight="600"
            letterSpacing={1}
          >
            {text}
          </Text>
          {icon !== undefined && icon(iconProps ?? defaultIconProps)}
        </XStack>
      )}
    </TamaguiButton>
  )
}
