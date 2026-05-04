export const STORE_TOKEN = 'STORE_TOKEN';

export interface TransferEvent {
  event_id: string;
  station_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface StationSummary {
  station_id: string;
  total_approved_amount: number;
  events_count: number;
}

export interface IngestResult {
  inserted: number;
  duplicates: number;
}

export interface StoreInterface {
  insertEvents(events: TransferEvent[]): Promise<IngestResult>;
  getStationSummary(stationId: string): Promise<StationSummary | null>;
}
