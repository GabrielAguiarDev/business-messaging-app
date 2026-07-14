import {useMemo} from 'react';

import {useInfiniteQuery} from '@tanstack/react-query';

import {Page} from '@types';

/**
 * Lista paginada genérica sobre useInfiniteQuery.
 * getList recebe o número da página (1-based) e devolve Page<Data> de domínio.
 */
export function usePaginatedList<Data>(
  queryKey: readonly unknown[],
  getList: (page: number) => Promise<Page<Data>>,
) {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({pageParam}) => getList(pageParam),
    initialPageParam: 1,
    getNextPageParam: ({meta}) =>
      meta.currentPage < meta.lastPage ? meta.currentPage + 1 : undefined,
  });

  const list = useMemo(
    () => query.data?.pages.flatMap(page => page.data) ?? [],
    [query.data],
  );

  return {
    list,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: () => query.fetchNextPage(),
    refresh: () => query.refetch(),
  };
}
