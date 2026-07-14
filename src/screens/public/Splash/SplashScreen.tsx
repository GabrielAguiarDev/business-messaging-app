import React, {useEffect, useRef} from 'react';

import {Animated} from 'react-native';

import {Box, Icon, Text} from '@components';

/** Splash do design: fundo accent + ícone pulsando + nome do app. */
export function SplashScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.94,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Box
      flex={1}
      backgroundColor="primary"
      alignItems="center"
      justifyContent="center"
      gap="s24">
      <Animated.View style={{transform: [{scale: pulse}], opacity: pulse}}>
        <Box
          width={98}
          height={98}
          alignItems="center"
          justifyContent="center"
          style={$iconBox}>
          <Icon name="chat" size={48} color="primaryContrast" />
        </Box>
      </Animated.View>
      <Box alignItems="center" gap="s4">
        <Text variant="headingLarge" color="primaryContrast">
          Central de Mensagens
        </Text>
        <Text variant="caption" style={$subtitle}>
          Comunicação corporativa
        </Text>
      </Box>
    </Box>
  );
}

const $iconBox = {
  borderRadius: 27,
  backgroundColor: 'rgba(255,255,255,0.16)',
};

const $subtitle = {color: 'rgba(255,255,255,0.78)'};
