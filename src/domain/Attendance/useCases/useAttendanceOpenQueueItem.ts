import {MutationOptions, useMutation} from '@infra';

import {attendanceService} from '../AttendanceService';
import {OpenQueueItemParams} from '../AttendanceTypes';

export function useAttendanceOpenQueueItem(
  options?: MutationOptions<string>,
) {
  const mutation = useMutation<OpenQueueItemParams, string>(
    attendanceService.openQueueItem,
    options,
  );

  return {
    isLoading: mutation.isLoading,
    error: mutation.error,
    openQueueItem: (params: OpenQueueItemParams) => mutation.mutate(params),
  };
}
