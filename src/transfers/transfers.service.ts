import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORE_TOKEN, StoreInterface } from '../store/store.interface';
import { CreateTransferBatchDto } from './dto/create-transfer.dto';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(@Inject(STORE_TOKEN) private readonly store: StoreInterface) {}

  ingest(dto: CreateTransferBatchDto) {
    const result = this.store.insertEvents(dto.events);
    this.logger.log(`Batch: inserted=${result.inserted} duplicates=${result.duplicates}`);
    return result;
  }
}
