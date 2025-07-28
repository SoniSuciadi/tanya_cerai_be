import { Injectable, Logger } from '@nestjs/common';
import * as pgPromise from 'pg-promise';

import pg, { IClient } from 'pg-promise/typescript/pg-subset';
import { format } from 'sql-formatter';
import {
  HardDeleteOneProps,
  InsertBulkProps,
  InsertOneProps,
  SoftDeleteOneProps,
  UpdateOneProps,
} from './database.type';
import toSnakeCase from 'src/common/helpers/toSnakeCase';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class DatabaseService {
  private static dbInstance: pgPromise.IDatabase<IClient>;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private user: UserService) {
    if (!DatabaseService.dbInstance) {
      this.logger.log('create new database instance');
      const initOptions: pgPromise.IInitOptions<IClient> = {
        query(e) {
          console.log('\n');
          console.log('====================================================');
          console.log('💸💸💸💸💸💸💸💸💸💸QuerySection💸💸💸💸💸💸💸💸💸');
          console.log('====================================================');
          console.log(format(e.query, { language: 'postgresql' }));
          console.log('=====================================================');
          console.log('💸💸💸💸💸💸💸💸💸EndQuerySection💸💸💸💸💸💸💸💸💸');
          console.log('=====================================================');
          console.log('\n');
        },
      };
      const pgp: pgPromise.IMain = pgPromise(initOptions);
      pgp.pg.types.setTypeParser(20, Number);

      const dbConfig: pg.IConnectionParameters<IClient> = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        application_name: 'tanya-cerai',
      };
      DatabaseService.dbInstance = pgp(dbConfig);
    } else {
      this.logger.log('database instance existing ');
    }
  }

  get db(): pgPromise.IDatabase<IClient> {
    return DatabaseService.dbInstance;
  }

  async testConnection() {
    try {
      const c = await this.db.connect();
      c.done();
      console.log('Success connect to database:');
      console.log(
        JSON.stringify(
          {
            database: c.client.database,
            port: c.client.port,
            host: c.client.host,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(
        JSON.stringify(
          {
            code: error.code,
            address: error.address,
            port: error.port,
          },
          null,
          2,
        ),
      );

      process.exit(1);
    }
  }

  async insertOne<T>({
    table,
    data,
    returning,
    transaction,
  }: InsertOneProps): Promise<T | null> {
    let query = `INSERT INTO "${table}" (`;
    query += Object.keys(data).map((column) => ` "${toSnakeCase(column)}"`);
    query += ` , created_at, updated_at, created_by, updated_by) VALUES (`;
    const dataValues = Object.values(data);
    query += dataValues.map((_, index) => `$${index + 1}`);
    query += ` , now(), now(), '${this.user.get()?.name || null}', '${this.user.get()?.name || null}')`;

    const values: unknown[] = dataValues;

    if (returning && returning.length) {
      query += ` RETURNING ${returning.join(',')}`;
    }

    const result = transaction
      ? await transaction.oneOrNone<T>(query, values)
      : await this.db.oneOrNone<T>(query, values);
    return result;
  }

  async insertBulk<T = unknown>({
    table,
    data,
    returning,
    transaction,
  }: InsertBulkProps): Promise<T[] | null> {
    if (!data.length) return null;

    const columns = Object.keys(data[0]).map(toSnakeCase);
    const rowsPlaceholder = data
      .map(
        (_, rowIndex) =>
          `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')}, now() + INTERVAL '${rowIndex + 1} second', now() + INTERVAL '${rowIndex + 1} second','${this.user.get()?.name || null}', '${this.user.get()?.name || null}')`,
      )
      .join(', ');
    let query = `INSERT INTO "${table}" (${columns.join(', ')}, created_at, updated_at,created_by, updated_by) VALUES ${rowsPlaceholder}`;

    const values = data.reduce(
      (acc, row) => [...acc, ...Object.values(row)],
      [],
    );

    if (returning && returning.length) {
      query += ` RETURNING ${returning.join(',')}`;
    }

    const result = transaction
      ? await transaction.manyOrNone<T>(query, values)
      : await this.db.manyOrNone<T>(query, values);
    return result;
  }
  async updateOne<T = unknown>({
    table,
    data,
    where,
    whereType,
    returning,
    transaction,
  }: UpdateOneProps): Promise<T[] | null> {
    if (!Object.keys(data).length) throw new Error('No data updated');
    let query = `UPDATE "${table}" SET`;
    query += ` updated_at = now(), `;
    query += Object.keys(data)
      .map((key, index) => ` "${toSnakeCase(key)}"=$${index + 1}`)
      .join(', ');

    query += ` WHERE `;
    query += Object.keys(where)
      .map((wh) => {
        const value = where[wh];
        if ((wh === 'deleted_by' || wh === 'deleted_at') && value === null) {
          return `"${toSnakeCase(wh)}" IS NULL`;
        } else {
          return `"${toSnakeCase(wh)}"=${typeof value === 'string' ? `'${value}'` : value}`;
        }
      })
      .join(` ${whereType ?? 'OR'} `);

    query += `${returning?.length ? ' RETURNING ' + returning.join(', ') : ''}`;

    const values = Object.values(data);

    const result = transaction
      ? await transaction.manyOrNone<T>(query, values)
      : await this.db.manyOrNone<T>(query, values);

    return result;
  }

  async softDeleteOne<T = unknown>({
    table,
    where,
    whereType,
    transaction,
    returning,
  }: SoftDeleteOneProps): Promise<T[] | null> {
    let query = `UPDATE ${table}
                SET deleted_at = NOW(),
                deleted_by = $<deletedBy>
                WHERE `;
    query += Object.keys(where)
      .map((wh) => {
        if (where[wh] === null) return `"${toSnakeCase(wh)}" IS NULL`;
        return `"${toSnakeCase(wh)}"=$<${wh}>`;
      })
      .join(` ${whereType ?? 'OR'} `);
    if (returning && returning.length) {
      query += ` RETURNING ${returning.join(',')}`;
    }
    const result = transaction
      ? await transaction.manyOrNone<T>(query, {
          ...where,
          deletedBy: `${this.user.get()?.name || null}'`,
        })
      : await this.db.manyOrNone<T>(query, {
          ...where,
          deletedBy: `${this.user.get()?.name || null}'`,
        });
    return result;
  }
  async hardDeleteOne<T = unknown>({
    table,
    where,
    whereType,
    transaction,
    returning,
  }: HardDeleteOneProps): Promise<T[] | null> {
    let query = `DELETE FROM ${table}
                WHERE `;
    query += Object.keys(where)
      .map((wh) => {
        if (where[wh] === null) return `"${toSnakeCase(wh)}" IS NULL`;
        return `"${toSnakeCase(wh)}"=$<${wh}>`;
      })
      .join(` ${whereType ?? 'OR'} `);
    if (returning && returning.length) {
      query += ` RETURNING ${returning.join(',')}`;
    }
    const result = transaction
      ? await transaction.manyOrNone<T>(query, { ...where })
      : await this.db.manyOrNone<T>(query, { ...where });
    return result;
  }
}
