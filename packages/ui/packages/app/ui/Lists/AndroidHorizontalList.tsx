import { ReactElement, useMemo, useState } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDecay,
} from 'react-native-reanimated'
import { Dimensions } from 'react-native'
import { isEmpty } from 'ramda'

type Props<T> = {
  data: T[]
  renderItem: (item: T) => ReactElement
  listEmptyComponent: ReactElement
}

const { width } = Dimensions.get('window')

export function AndroidHorizontalList<T>({
  data,
  renderItem,
  listEmptyComponent,
}: Props<T>) {
  const [maxTranslation, setMaxTranslation] = useState<number>(0)
  const x = useSharedValue(0)
  const dragStart = useSharedValue(x.value)

  const listStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: x.value,
        },
      ],
    }
  }, [])

  if (isEmpty(data)) {
    return listEmptyComponent
  }

  return (
    <Animated.View
      className={'absolute flex-row'}
      style={[listStyle]}
      onLayout={(e) => {
        // 16 is the padding from the right
        setMaxTranslation(Math.max(e.nativeEvent.layout.width + 16 - width, 0))
      }}
    >
      {data.map(renderItem)}
    </Animated.View>
  )
}
