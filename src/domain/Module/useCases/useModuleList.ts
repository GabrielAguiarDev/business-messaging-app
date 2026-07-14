import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {moduleService} from '../ModuleService';

export function useModuleList() {
  const {data, isLoading, isError, refetch} = useQuery({
    queryKey: [QueryKeys.ModuleList],
    queryFn: moduleService.getModules,
  });

  return {
    modules: data ?? [],
    isLoading,
    isError,
    refetch,
  };
}
