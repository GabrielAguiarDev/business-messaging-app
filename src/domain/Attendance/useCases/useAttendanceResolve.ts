import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {attendanceService} from '../AttendanceService';

export function useAttendanceResolve(options?: MutationOptions<void>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<string, void>(attendanceService.resolve, {
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChannelQueues]});
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatDetails]});
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatMessages]});
      queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
      options?.onSuccess?.(undefined);
    },
    onError: options?.onError,
  });

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    resolve: (chatId: string) => mutation.mutate(chatId),
  };
}
