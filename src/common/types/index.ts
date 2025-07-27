export interface Option {
  label: string;
  value: string;
}

export interface AxiosDataResponse<T> {
  message: string;
  data: T;
}
