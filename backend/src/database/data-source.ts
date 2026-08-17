import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * Standalone DataSource for the TypeORM CLI (migrations) and the seed script.
 * Not used by the running Nest app (see app.module.ts) — synchronize is always
 * false here so CLI tooling never auto-syncs the schema.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
