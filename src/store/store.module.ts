import { Module } from '@nestjs/common';
import { MemoryStore } from './memory.store';
import { STORE_TOKEN } from './store.interface';

@Module({
  providers: [{ provide: STORE_TOKEN, useClass: MemoryStore }],
  exports: [STORE_TOKEN],
})
export class StoreModule {}
