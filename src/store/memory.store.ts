import { Injectable } from '@nestjs/common';
import {
  IngestResult,
  StationSummary,
  StoreInterface,
  TransferEvent,
} from './store.interface';

@Injectable()
export class MemoryStore implements StoreInterface {
  private readonly events = new Map<string, TransferEvent>();

  /**
   * Synchronous Map.has + Map.set is atomic within a single Node.js event loop
   * tick, so no two requests can interleave inside this method.
   * See README for the multi-process caveat.
   */
  async insertEvents(events: TransferEvent[]): Promise<IngestResult> {
    let inserted = 0;
    let duplicates = 0;

    for (const event of events) {
      if (this.events.has(event.event_id)) {
        duplicates++;
      } else {
        this.events.set(event.event_id, event);
        inserted++;
      }
    }

    return { inserted, duplicates };
  }

  async getStationSummary(stationId: string): Promise<StationSummary | null> {
    const stationEvents = [...this.events.values()].filter(
      (e) => e.station_id === stationId,
    );

    if (stationEvents.length === 0) return null;

    const total_approved_amount = stationEvents
      .filter((e) => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      station_id: stationId,
      total_approved_amount,
      events_count: stationEvents.length,
    };
  }
}
