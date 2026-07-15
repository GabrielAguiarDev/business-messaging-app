import React from 'react';

import {
  Avatar,
  Badge,
  Box,
  Icon,
  Text,
  TouchableOpacityBox,
} from '@components';
import {ModuleGroup} from '@domain';

interface GroupListItemProps {
  group: ModuleGroup;
  onPress: () => void;
}

export function GroupListItem({group, onPress}: GroupListItemProps) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.7}
      flexDirection="row"
      alignItems="center"
      gap="s12"
      paddingHorizontal="s16"
      paddingTop="s8">
      <Avatar
        label={group.initials}
        color={group.avatarColor}
        photoUri={group.avatarUrl}
        shape="circle"
        size={50}
      />
      <Box
        flex={1}
        borderBottomWidth={1}
        borderColor="separator"
        paddingBottom="s12">
        <Box flexDirection="row" alignItems="center">
          <Text variant="itemTitle" numberOfLines={1} flexShrink={1}>
            {group.name}
          </Text>
          <Box flex={1} />
          <Text
            variant="caption"
            color={group.unreadCount > 0 ? 'primary' : 'textSecondary'}>
            {group.time}
          </Text>
        </Box>
        <Box flexDirection="row" alignItems="center" gap="s6" marginTop="s2">
          {group.muted && <Icon name="bellOff" size={14} color="textTertiary" />}
          <Text
            variant="paragraphSecondary"
            numberOfLines={1}
            flex={1}
            flexShrink={1}>
            {group.lastMessage}
          </Text>
          <Badge count={group.unreadCount} />
        </Box>
      </Box>
    </TouchableOpacityBox>
  );
}
