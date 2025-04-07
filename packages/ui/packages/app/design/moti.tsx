import { MotiView as View } from 'moti'
import { cssInterop, remapProps } from 'nativewind'

remapProps(View, { className: 'style' })

export const MotiView = View
