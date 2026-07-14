import {useQueryClient} from '@tanstack/react-query';

import {MutationOptions, QueryKeys, useMutation} from '@infra';

import {attendanceService} from '../AttendanceService';
import {AssumeParams} from '../AttendanceTypes';

export function useAttendanceAssume(options?: MutationOptions<string>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<AssumeParams, string>(
    attendanceService.assume,
    {
      onSuccess: chatId => {
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChannelQueues]});
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChannelList]});
        queryClient.invalidateQueries({queryKey: [QueryKeys.ChatList]});
        options?.onSuccess?.(chatId);
      },
      onError: options?.onError,
    },
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    assume: (params: AssumeParams) => mutation.mutate(params),
  };
}
