import React, {useMemo} from 'react';

import {TextStyle} from 'react-native';

import {Box, Icon, Text, TouchableOpacityBox} from '@components';
import {Message} from '@domain';
import {formatDuration} from '@utils';

import {useAudioPlayback} from './useAudioPlayback';

interface VoiceMessageBubbleProps {
  message: Message;
}

const BAR_COUNT = 26;
const BAR_MAX_HEIGHT = 22;

/** Onda decorativa determinística (não é a amplitude real do áudio) — seed = id da mensagem, estável entre renders. */
function waveformBars(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return Array.from({length: BAR_COUNT}, () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 0.28 + (((h >>> 8) % 1000) / 1000) * 0.72;
  });
}

export function VoiceMessageBubble({message}: VoiceMessageBubbleProps) {
  const bars = useMemo(() => waveformBars(message.id), [message.id]);
  const totalDuration = message.audioDuration ?? 0;
  const {isPlaying, toggle, elapsedSeconds} = useAudioPlayback(
    message.id,
    message.audioUri ?? '',
  );
  const displaySeconds = elapsedSeconds > 0 ? elapsedSeconds : totalDuration;
  const progressRatio =
    totalDuration > 0 ? Math.min(1, elapsedSeconds / totalDuration) : 0;
  const activeBars = Math.round(progressRatio * BAR_COUNT);

  return (
    <Box flexDirection="row" alignItems="center" gap="s8" minWidth={220}>
      <TouchableOpacityBox
        onPress={toggle}
        activeOpacity={0.75}
        width={34}
        height={34}
        borderRadius="full"
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center">
        <Icon
          name={isPlaying ? 'pause' : 'play'}
          size={16}
          color="primaryContrast"
        />
      </TouchableOpacityBox>

      <Box
        flex={1}
        flexDirection="row"
        alignItems="center"
        gap="s2"
        height={BAR_MAX_HEIGHT}>
        {bars.map((barHeight, i) => (
          <Box
            key={i}
            flex={1}
            height={Math.max(3, barHeight * BAR_MAX_HEIGHT)}
            borderRadius="br4"
            backgroundColor={i < activeBars ? 'primary' : 'textTertiary'}
          />
        ))}
      </Box>

      <Text variant="tiny" style={$duration}>
        {formatDuration(displaySeconds)}
      </Text>
    </Box>
  );
}

const $duration: TextStyle = {minWidth: 32, textAlign: 'right'};
