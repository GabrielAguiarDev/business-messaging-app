import {useQuery} from '@tanstack/react-query';

import {QueryKeys} from '@infra';

import {moduleService} from '../ModuleService';

export function useModuleContent(moduleId: string) {
  const {data, isLoading, isError} = useQuery({
    queryKey: [QueryKeys.ModuleContent, moduleId],
    queryFn: () => moduleService.getModuleContent(moduleId),
  });

  return {
    content: data,
    isLoading,
    isError,
  };
}
