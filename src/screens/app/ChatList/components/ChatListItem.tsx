import React, {useRef} from 'react';

import ReanimatedSwipeable, {
  SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import type {SharedValue} from 'react-native-reanimated';

import {
  Avatar,
  Badge,
  Box,
  Icon,
  IconName,
  Text,
  TouchableOpacityBox,
} from '@components';
import {Chat} from '@domain';
import {ThemeColors} from '@theme';

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
  onToggleMute: () => void;
  onDelete: () => void;
}

export function ChatListItem({
  chat,
  onPress,
  onToggleMute,
  onDelete,
}: ChatListItemProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  // o pan do swipe é nativo e não cancela o press do Touchable (JS):
  // soltar o arrasto dispara onPress. Enquanto arrasta → ignorar o press;
  // já aberto e parado → press fecha as ações em vez de navegar.
  const isDraggingRef = useRef(false);
  const isOpenRef = useRef(false);

  function handleRowPress() {
    if (isDraggingRef.current) {
      return;
    }
    if (isOpenRef.current) {
      swipeableRef.current?.close();
      return;
    }
    onPress();
  }

  function handleSwipeStartDrag() {
    isDraggingRef.current = true;
  }

  function handleSwipeOpen() {
    isDraggingRef.current = false;
    isOpenRef.current = true;
  }

  function handleSwipeClose() {
    isDraggingRef.current = false;
    isOpenRef.current = false;
  }

  function renderRightActions(
    _progress: SharedValue<number>,
    _translation: SharedValue<number>,
    swipeable: SwipeableMethods,
  ) {
    return (
      <Box flexDirection="row">
        <SwipeAction
          icon={chat.muted ? 'bell' : 'bellOff'}
          label={chat.muted ? 'Reativar' : 'Silenciar'}
          backgroundColor="chip"
          color="text"
          onPress={() => {
            swipeable.close();
            onToggleMute();
          }}
        />
        <SwipeAction
          icon="trash"
          label="Apagar"
          backgroundColor="danger"
          color="primaryContrast"
          onPress={() => {
            swipeable.close();
            onDelete();
          }}
        />
      </Box>
    );
  }

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableOpenStartDrag={handleSwipeStartDrag}
      onSwipeableCloseStartDrag={handleSwipeStartDrag}
      onSwipeableOpen={handleSwipeOpen}
      onSwipeableClose={handleSwipeClose}
      renderRightActions={renderRightActions}>
      {/* bg opaco FORA do touchable: no press a opacidade revela este fundo,
          não as ações de swipe atrás da linha */}
      <Box backgroundColor="background">
        <TouchableOpacityBox
          onPress={handleRowPress}
          activeOpacity={0.7}
          flexDirection="row"
          alignItems="center"
          gap="s12"
          paddingHorizontal="s16"
          paddingTop="s10">
        <Avatar
          label={chat.initials}
          color={chat.avatarColor}
          photoUri={chat.avatarUrl}
          shape="circle"
          size={52}
        />
        <Box
          flex={1}
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s12">
          <Box flexDirection="row" alignItems="center" gap="s6">
            <Text variant="itemTitle" numberOfLines={1} flexShrink={1}>
              {chat.name}
            </Text>
            {chat.context && (
              <Box
                backgroundColor="chip"
                borderRadius="br6"
                paddingHorizontal="s6"
                flexShrink={1}>
                <Text fontSize={10.5} color="textSecondary" numberOfLines={1}>
                  {chat.context}
                </Text>
              </Box>
            )}
            <Box flex={1} />
            <Text
              variant="caption"
              color={chat.unreadCount > 0 ? 'primary' : 'textSecondary'}>
              {chat.lastMessageTime}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap="s6" marginTop="s2">
            {chat.muted && (
              <Icon name="bellOff" size={14} color="textTertiary" />
            )}
            <Text
              variant="paragraphSecondary"
              numberOfLines={1}
              flex={1}
              flexShrink={1}>
              {chat.lastMessage}
            </Text>
            <Badge count={chat.unreadCount} />
          </Box>
        </Box>
        </TouchableOpacityBox>
      </Box>
    </ReanimatedSwipeable>
  );
}

function SwipeAction({
  icon,
  label,
  backgroundColor,
  color,
  onPress,
}: {
  icon: IconName;
  label: string;
  backgroundColor: keyof ThemeColors;
  color: keyof ThemeColors;
  onPress: () => void;
}) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.8}
      width={78}
      alignItems="center"
      justifyContent="center"
      gap="s4"
      backgroundColor={backgroundColor}>
      <Icon name={icon} size={22} color={color} />
      <Text fontSize={11.5} fontWeight="600" color={color}>
        {label}
      </Text>
    </TouchableOpacityBox>
  );
}
