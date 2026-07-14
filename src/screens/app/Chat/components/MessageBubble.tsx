import React from 'react';

import {Image, ImageStyle} from 'react-native';

import {Box, Icon, Text} from '@components';
import {Message} from '@domain';

import {VoiceMessageBubble} from './VoiceMessageBubble';

interface MessageBubbleProps {
  message: Message;
}

function MessageContent({message}: MessageBubbleProps) {
  if (message.kind === 'audio') {
    return <VoiceMessageBubble message={message} />;
  }
  if (message.kind === 'image') {
    return (
      <Image source={{uri: message.imageUri}} style={$image} resizeMode="cover" />
    );
  }
  return <Text variant="paragraph">{message.text}</Text>;
}

export function MessageBubble({message}: MessageBubbleProps) {
  if (message.kind === 'system') {
    return (
      <Box
        alignSelf="center"
        backgroundColor="primaryTint"
        borderRadius="br10"
        paddingHorizontal="s12"
        paddingVertical="s4"
        marginVertical="s4">
        <Text variant="captionSmall" textAlign="center">
          {message.text}
        </Text>
      </Box>
    );
  }

  if (message.isMine) {
    return (
      <Box
        alignSelf="flex-end"
        maxWidth="80%"
        backgroundColor="bubbleOutgoing"
        borderRadius="br14"
        borderTopRightRadius="br4"
        paddingHorizontal="s10"
        paddingVertical="s8">
        <MessageContent message={message} />
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="flex-end"
          gap="s2"
          marginTop="s2">
          <Text variant="tiny">{message.time}</Text>
          {message.ticks === 'read' && (
            <Icon name="doubleCheck" size={13} color="primary" />
          )}
          {message.ticks === 'sent' && (
            <Icon name="check" size={13} color="textTertiary" />
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      alignSelf="flex-start"
      maxWidth="80%"
      backgroundColor="bubbleIncoming"
      borderRadius="br14"
      borderTopLeftRadius="br4"
      paddingHorizontal="s10"
      paddingVertical="s8"
      shadowColor="text"
      shadowOpacity={0.06}
      shadowRadius={1}
      shadowOffset={$shadowOffset}
      elevation={1}>
      {message.author && (
        <Text
          variant="captionSmall"
          fontWeight="700"
          marginBottom="s2"
          style={{color: message.author.color}}>
          {message.author.name}
        </Text>
      )}
      <MessageContent message={message} />
      <Text variant="tiny" textAlign="right" marginTop="s2">
        {message.time}
      </Text>
    </Box>
  );
}

const $shadowOffset = {width: 0, height: 1};

const $image: ImageStyle = {
  width: 220,
  height: 220,
  borderRadius: 10,
};
