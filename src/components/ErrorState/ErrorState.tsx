import React from 'react';

import {Box} from '../Box/Box';
import {Button} from '../Button/Button';
import {EmptyState} from '../EmptyState/EmptyState';

export interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

/** Estado de erro padrão de listas, com ação de tentar novamente. */
export function ErrorState({
  message = 'Não foi possível carregar. Verifique sua conexão.',
  onRetry,
}: ErrorStateProps) {
  return (
    <Box flex={1}>
      <EmptyState icon="chat" title="Algo deu errado" message={message} />
      <Box alignItems="center" paddingBottom="s40">
        <Button title="Tentar novamente" preset="outline" onPress={onRetry} />
      </Box>
    </Box>
  );
}
