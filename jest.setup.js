/* eslint-env jest */
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('@gorhom/bottom-sheet', () =>
  require('@gorhom/bottom-sheet/mock'),
);

jest.mock('react-native-config', () => ({
  API_URL: 'https://api.test.local/v1',
}));

jest.mock('@callstack/liquid-glass', () => {
  const {View} = require('react-native');
  return {
    isLiquidGlassSupported: false,
    LiquidGlassView: View,
    LiquidGlassContainerView: View,
  };
});

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  CameraRoll: {
    getPhotos: jest.fn(async () => ({
      edges: [],
      page_info: {has_next_page: false},
    })),
  },
}));

jest.mock('react-native-nitro-sound', () => ({
  __esModule: true,
  default: {
    startRecorder: jest.fn(async () => '/tmp/test.m4a'),
    stopRecorder: jest.fn(async () => '/tmp/test.m4a'),
    addRecordBackListener: jest.fn(),
    removeRecordBackListener: jest.fn(),
    startPlayer: jest.fn(async () => '/tmp/test.m4a'),
    stopPlayer: jest.fn(async () => ''),
    pausePlayer: jest.fn(async () => ''),
    resumePlayer: jest.fn(async () => ''),
    seekToPlayer: jest.fn(async () => ''),
    addPlayBackListener: jest.fn(),
    removePlayBackListener: jest.fn(),
    addPlaybackEndListener: jest.fn(),
    removePlaybackEndListener: jest.fn(),
  },
}));

jest.mock('react-native-vision-camera', () => {
  const {View} = require('react-native');
  return {
    Camera: View,
    useCameraDevice: () => null,
    useCameraPermission: () => ({
      hasPermission: true,
      requestPermission: jest.fn(async () => true),
    }),
  };
});

jest.mock('@react-native-community/blur', () => {
  const {View} = require('react-native');
  return {BlurView: View};
});

jest.mock('@react-native-clipboard/clipboard', () =>
  require('@react-native-clipboard/clipboard/jest/clipboard-mock.js'),
);

jest.mock('react-native-haptic-feedback', () => ({
  __esModule: true,
  trigger: jest.fn(),
  default: {trigger: jest.fn()},
}));

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: key => store.get(key),
      set: (key, value) => store.set(key, value),
      remove: key => store.delete(key),
      clearAll: () => store.clear(),
    }),
  };
});
