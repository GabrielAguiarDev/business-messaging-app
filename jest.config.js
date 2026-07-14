module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // worklets/reanimated 4: usa a implementação JS (sem TurboModule) no Jest
  resolver: 'react-native-worklets/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@callstack/liquid-glass|@gorhom|react-native-.*)/)',
  ],
};
