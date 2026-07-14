import React from 'react';

import {Box} from '../Box/Box';
import {Icon, IconName} from '../Icon/Icon';
import {Text} from '../Text/Text';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
}

/** Estado vazio padrão do design: círculo chip + título + mensagem. */
export function EmptyState({icon, title, message}: EmptyStateProps) {
  return (
    <Box
      flex={1}
      alignItems="center"
      justifyContent="center"
      gap="s12"
      paddingHorizontal="s40"
      paddingVertical="s56">
      <Box
        width={64}
        height={64}
        borderRadius="full"
        backgroundColor="chip"
        alignItems="center"
        justifyContent="center">
        <Icon name={icon} size={30} color="textTertiary" />
      </Box>
      <Text variant="itemTitle" textAlign="center">
        {title}
      </Text>
      <Text variant="caption" textAlign="center">
        {message}
      </Text>
    </Box>
  );
}
