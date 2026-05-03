import { Module } from '@nestjs/common';
import { StoreModule } from '../store/store.module';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';

@Module({
  imports: [StoreModule],
  controllers: [StationsController],
  providers: [StationsService],
})
export class StationsModule {}
