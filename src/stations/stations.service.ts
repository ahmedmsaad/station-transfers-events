import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { STORE_TOKEN, StoreInterface } from '../store/store.interface';

@Injectable()
export class StationsService {
  constructor(@Inject(STORE_TOKEN) private readonly store: StoreInterface) {}

  async getSummary(stationId: string) {
    const summary = await this.store.getStationSummary(stationId);
    if (!summary) {
      throw new NotFoundException(`Station '${stationId}' not found`);
    }
    return summary;
  }
}
