import {useMutation as useReactQueryMutation} from '@tanstack/react-query';

import {ApiError, toApiError} from '@utils';

export interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Wrapper do useMutation do react-query que normaliza erros do axios
 * num ApiError {status, message} com mensagens default em pt-BR.
 * Os domínios devem usar ESTE hook, não o do react-query direto.
 */
export function useMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: MutationOptions<TData>,
) {
  const mutation = useReactQueryMutation<TData, unknown, TVariables>({
    mutationFn,
    retry: false,
    onSuccess: data => options?.onSuccess?.(data),
    onError: error => options?.onError?.(toApiError(error)),
  });

  return {
    mutate: (variables: TVariables) => mutation.mutate(variables),
    mutateAsync: (variables: TVariables) => mutation.mutateAsync(variables),
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error ? toApiError(mutation.error) : null,
    reset: mutation.reset,
  };
}
