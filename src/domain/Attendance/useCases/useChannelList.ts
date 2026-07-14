import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {attendanceService} from '../AttendanceService';

export function useChannelList() {
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: [QueryKeys.ChannelList],
    queryFn: attendanceService.getChannels,
  });

  return {
    channels: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
