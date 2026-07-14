export interface MetaDataPage {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
}

export interface Page<Data> {
  meta: MetaDataPage;
  data: Data[];
}
