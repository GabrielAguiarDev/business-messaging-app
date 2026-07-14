module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        alias: {
          '@api': './src/api',
          '@assets': './src/assets',
          '@brand': './src/brand',
          '@components': './src/components',
          '@config': './src/config',
          '@domain': './src/domain',
          '@hooks': './src/hooks',
          '@infra': './src/infra',
          '@routes': './src/routes',
          '@screens': './src/screens',
          '@services': './src/services',
          '@theme': './src/theme',
          '@types': './src/types',
          '@utils': './src/utils',
        },
      },
    ],
    // precisa ser o ÚLTIMO plugin (reanimated 4 / worklets)
    'react-native-worklets/plugin',
  ],
};
