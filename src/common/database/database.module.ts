import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { UserModule } from 'src/modules/user/user.module';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
  imports: [UserModule],
})
export class DatabaseModule {}
