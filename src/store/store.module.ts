import { Module } from '@nestjs/common';
import { MemoryStore } from './memory.store';
import { PostgresStore } from './postgres.store';
import { STORE_TOKEN, StoreInterface } from './store.interface';

@Module({
  providers: [
    {
      provide: STORE_TOKEN,
      useFactory: async (): Promise<StoreInterface> => {
        if (process.env.STORE_TYPE === 'postgres') {
          const store = new PostgresStore();
          await store.init();
          return store;
        }
        return new MemoryStore();
      },
    },
  ],
  exports: [STORE_TOKEN],
})
export class StoreModule {}
