import { DataSourceOptions } from 'typeorm';
import { SnakeCaseNamingStrategy } from '../strategies/snake-case.strategy';

// Log database configuration for debugging (remove in production)
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 5432);
const dbDatabase = process.env.DB_DATABASE || 'aru_crm';
const dbUsername = process.env.DB_USERNAME || 'aru';

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  host: dbHost,
  port: dbPort,
  database: dbDatabase,
  username: dbUsername,
  password: process.env.DB_PASSWORD || 'aru_secret',
  logNotifications: true,
  schema: 'public',
  ssl: process.env.DB_SSL === 'true',
  migrations: [`${__dirname}/migrations/**`],
  namingStrategy: new SnakeCaseNamingStrategy(),
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
};
