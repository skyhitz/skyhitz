import { Text, View } from 'react-native'
import { StellarExpertLink } from 'app/ui/links/StellarExpertLink'

type LinkWithLabelProps = {
  type: 'account' | 'asset' | 'tx' | 'offer'
  id: string
  className?: string
}

export function LinkWithLabel({
  type,
  id,
  className = 'w-20',
}: LinkWithLabelProps) {
  const label =
    type === 'tx' ? 'Transaction' : type.charAt(0).toUpperCase() + type.slice(1)
  return (
    <View className="flex-row items-center md:ml-1">
      <Text className="text-grey text-sm">{label}: </Text>
      <StellarExpertLink id={id} path={type} className={className} />
    </View>
  )
}
