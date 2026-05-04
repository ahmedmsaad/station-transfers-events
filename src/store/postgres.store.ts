import { Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
  IngestResult,
  StationSummary,
  StoreInterface,
  TransferEvent,
} from './store.interface';

export class PostgresStore implements StoreInterface {
  private readonly logger = new Logger(PostgresStore.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      database: process.env.DB_NAME ?? 'station_transfers',
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
    });
  }

  // DDL here instead of migration files: keeps local/docker setup minimal (no
  // migration runner). For evolving schema in production, prefer versioned migrations.
  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transfer_events (
        event_id   TEXT          PRIMARY KEY,
        station_id TEXT          NOT NULL,
        amount     NUMERIC(15,4) NOT NULL,
        status     TEXT          NOT NULL,
        created_at TIMESTAMPTZ   NOT NULL
      )
    `);
    this.logger.log('PostgresStore ready');
  }

  async insertEvents(events: TransferEvent[]): Promise<IngestResult> {
    if (events.length === 0) return { inserted: 0, duplicates: 0 };

    // Single atomic INSERT … ON CONFLICT DO NOTHING
    // RETURNING lets us count exactly what was inserted vs skipped.
    const placeholders = events
      .map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`)
      .join(', ');

    const values = events.flatMap((e) => [
      e.event_id,
      e.station_id,
      e.amount,
      e.status,
      e.created_at,
    ]);

    const { rowCount } = await this.pool.query(
      `INSERT INTO transfer_events (event_id, station_id, amount, status, created_at)
       VALUES ${placeholders}
       ON CONFLICT (event_id) DO NOTHING
       RETURNING event_id`,
      values,
    );

    const inserted = rowCount ?? 0;
    return { inserted, duplicates: events.length - inserted };
  }

  async getStationSummary(stationId: string): Promise<StationSummary | null> {
    const { rows } = await this.pool.query<{
      events_count: string;
      total_approved_amount: string;
    }>(
      `SELECT
         COUNT(*)                                                      AS events_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0)  AS total_approved_amount
       FROM transfer_events
       WHERE station_id = $1`,
      [stationId],
    );

    const row = rows[0];
    if (!row || parseInt(row.events_count, 10) === 0) return null;

    return {
      station_id: stationId,
      total_approved_amount: parseFloat(row.total_approved_amount),
      events_count: parseInt(row.events_count, 10),
    };
  }
}
