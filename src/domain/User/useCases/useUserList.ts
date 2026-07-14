import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {userService} from '../UserService';

export function useUserList() {
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: [QueryKeys.UserList],
    queryFn: userService.getList,
  });

  return {
    users: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
