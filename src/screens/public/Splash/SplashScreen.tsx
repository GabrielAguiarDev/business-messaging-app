import React, {useEffect, useState} from 'react';

import {StyleSheet} from 'react-native';

import {Fit, RiveView, useRiveFile} from '@rive-app/react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

import splashChat from '@assets/splash-chat.riv';
import {Box, Text} from '@components';
import {palette} from '@theme';

const FADE_IN_DURATION = 400;
const FADE_OUT_DURATION = 200;

type SplashScreenProps = {
  /** Quando true, dispara o fade out e desmonta ao final. */
  hidden?: boolean;
};

/** Splash do design: fundo accent + animação Rive + nome do app. */
export function SplashScreen({hidden = false}: SplashScreenProps) {
  const {riveFile} = useRiveFile(splashChat);
  const [hasError, setHasError] = useState(false);
  const [removed, setRemoved] = useState(false);
  const opacity = useSharedValue(0);

  // Fade in ao montar
  useEffect(() => {
    opacity.value = withTiming(1, {duration: FADE_IN_DURATION});
  }, [opacity]);

  // Fade out ao terminar o carregamento; desmonta ao final
  useEffect(() => {
    if (hidden) {
      opacity.value = withTiming(0, {duration: FADE_OUT_DURATION}, finished => {
        if (finished) {
          scheduleOnRN(setRemoved, true);
        }
      });
    }
  }, [hidden, opacity]);

  const $animated = useAnimatedStyle(() => ({opacity: opacity.value}));

  if (removed) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, $background, $animated]}
      pointerEvents={hidden ? 'none' : 'auto'}>
      <Box flex={1} alignItems="center" justifyContent="center">
        <Box
          width={200}
          height={200}
          alignItems="center"
          justifyContent="center">
          {riveFile && !hasError ? (
            <RiveView
              file={riveFile}
              autoPlay
              fit={Fit.Contain}
              onError={() => setHasError(true)}
              style={$rive}
            />
          ) : null}
        </Box>
        <Box alignItems="center" gap="s4">
          <Text variant="headingLarge" color="primaryContrast">
            Central de Mensagens
          </Text>
          <Text variant="caption" style={$subtitle}>
            Comunicação corporativa
          </Text>
        </Box>
      </Box>
    </Animated.View>
  );
}

const $background = {backgroundColor: palette.bubbleOutDark};

const $rive = {width: '100%', height: '100%'} as const;

const $subtitle = {color: 'rgba(255,255,255,0.78)'};
