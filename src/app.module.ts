import { Module } from '@nestjs/common';
import { StationsModule } from './stations/stations.module';
import { TransfersModule } from './transfers/transfers.module';

@Module({
  imports: [TransfersModule, StationsModule],
})
export class AppModule {}
