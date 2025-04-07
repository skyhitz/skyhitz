import Svg, { Path } from 'react-native-svg'

function Icon(props: any) {
  return (
    <Svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
      <Path
        d="M7 16.999l10-10M17 16.999l-10-10M.5 11.999a11.5 11.5 0 1023 0 11.5 11.5 0 10-23 0z"
        fill="none"
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  )
}

export default Icon
