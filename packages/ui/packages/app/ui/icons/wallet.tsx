'use client'
import Svg, { Path } from 'react-native-svg'

function Icon({ size = 24, color = 'currentColor' }) {
  return (
    <Svg fill="none" viewBox="0 0 48 48" height={size} width={size}>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 33.822h7.65v4.78h3.826M2 19.476h6.695v-3.825h3.825M2 28.086h9.564m0 0v-5.738h3.825m-3.825 5.738h9.563"
      />
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M42.167 31.909v4.78a6.694 6.694 0 01-6.694 6.695H5.825A3.825 3.825 0 012 39.56V14.694a3.826 3.826 0 013.825-3.826h29.648a6.695 6.695 0 016.694 6.695v4.782"
      />
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M36.207 10.907l-1.21-4.843a1.915 1.915 0 00-2.353-1.383L9.65 10.87M42.175 22.346h-5.746a3.825 3.825 0 00-3.825 3.825v1.913a3.825 3.825 0 003.825 3.826h5.746A3.825 3.825 0 0046 28.084v-1.913a3.825 3.825 0 00-3.825-3.825z"
      />
      <Path
        stroke="currentColor"
        d="M36.907 27.604a.478.478 0 010-.956M36.907 27.604a.478.478 0 000-.956M19.693 22.826a.478.478 0 110-.956M19.693 22.826a.478.478 0 100-.956M26.385 15.173a.478.478 0 010-.957M26.385 15.173a.478.478 0 000-.957M17.779 39.08a.478.478 0 010-.956M17.779 39.08a.478.478 0 000-.956"
      />
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M42.167 18.52H33.56v-3.825h-2.87M37.385 31.91v4.781h-7.65"
      />
    </Svg>
  )
}

export default Icon
