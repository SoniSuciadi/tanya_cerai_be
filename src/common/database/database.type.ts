import * as pgPromise from 'pg-promise';

import { IClient } from 'pg-promise/typescript/pg-subset';

export interface InsertOneProps {
  transaction?:
    | pgPromise.IDatabase<IClient>
    | (pgPromise.ITask<IClient> & IClient);
  table: string;
  data: { [key: string]: unknown };
  returning?: string[];
}

export interface InsertBulkProps {
  table: string;
  data: { [key: string]: unknown }[];
  transaction?: pgPromise.ITask<IClient> & IClient;
  returning?: string[];
}
type WhereQuery = {
  [key: string]: number | string | null;
};

type WhereTypeQuery = 'AND' | 'OR';
export interface UpdateOneProps extends InsertOneProps {
  where: WhereQuery;
  whereType?: WhereTypeQuery;
}
export interface SoftDeleteOneProps {
  table: string;
  transaction?: pgPromise.ITask<IClient> & IClient;
  where: WhereQuery;
  whereType?: WhereTypeQuery;
  returning?: string[];
}

export type HardDeleteOneProps = Omit<SoftDeleteOneProps, 'deletedBy'>;
