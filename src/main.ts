import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

import * as bodyParser from 'body-parser';
import { HandleError } from './common/interceptors/handleError.interceptor';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import { DatabaseService } from './common/database/database.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import 'dayjs/locale/id';
// init time
dotenv.config();
dayjs.extend(utc);
dayjs.locale('id');

dotenv.config();
class Application {
  private app: INestApplication;
  private readonly PORT = process.env.PORT || 3000;
  // ----
  private configureMiddleware() {
    this.app.enableCors({
      origin: process.env.FE_ORIGIN?.split(',') || '*',
      methods: 'GET,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, ClientPath, Authorization',
      credentials: true,
    });
    this.app.use(compression());
    this.app.use(cookieParser());
    this.app.use(bodyParser.json({ limit: '30mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));
  }

  private setupInterceptorsAndFilters() {
    this.app.useGlobalFilters(new HandleError());
  }
  private async start() {
    await this.app.listen(this.PORT, () => {
      console.log(`Server running on port : ${this.PORT}`);
      console.log(`Server date: ${new Date()}`);
      const databaseService = this.app.get(DatabaseService);
      databaseService.testConnection();
    });
  }
  async initialize() {
    this.app = await NestFactory.create(AppModule, {
      logger: ['debug', 'error', 'log', 'verbose', 'warn', 'fatal'],
    });
    console.log({
      origin: process.env.FE_ORIGIN?.split(',') || '*',
      methods: 'GET,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, ClientPath, Authorization',
      credentials: true,
    });
    this.configureMiddleware();
    this.setupInterceptorsAndFilters();
    this.app.setGlobalPrefix('v1');
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await this.start();
  }
}

const application = new Application();
application.initialize();
