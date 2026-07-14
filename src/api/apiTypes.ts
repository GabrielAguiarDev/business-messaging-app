export interface MetaDataPageAPI {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  first_page: number;
}

export interface PageAPI<Data> {
  meta: MetaDataPageAPI;
  data: Data[];
}
