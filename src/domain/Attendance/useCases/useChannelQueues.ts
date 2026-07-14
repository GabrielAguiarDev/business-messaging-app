import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {attendanceService} from '../AttendanceService';

export function useChannelQueues(channelId: string) {
  const {data, isLoading, isError} = useQuery({
    queryKey: [QueryKeys.ChannelQueues, channelId],
    queryFn: () => attendanceService.getQueues(channelId),
  });

  return {
    queues: data,
    isLoading,
    isError,
  };
}
