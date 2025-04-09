// Shim for moti/build/components/image component
import { Image as RImage } from 'react-native-web';
import { motify } from 'moti/build/core';

export const MotiImage = motify(RImage)();
export default MotiImage;
