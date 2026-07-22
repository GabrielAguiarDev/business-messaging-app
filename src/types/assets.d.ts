declare module '*.jpeg' {
  import {ImageSourcePropType} from 'react-native';
  const source: ImageSourcePropType;
  export default source;
}

declare module '*.jpg' {
  import {ImageSourcePropType} from 'react-native';
  const source: ImageSourcePropType;
  export default source;
}

declare module '*.png' {
  import {ImageSourcePropType} from 'react-native';
  const source: ImageSourcePropType;
  export default source;
}

declare module '*.riv' {
  // require() de um .riv resolve para o asset id numérico do Metro
  const source: number;
  export default source;
}
