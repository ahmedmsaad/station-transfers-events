import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Station Transfers API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const makeEvent = (overrides: Record<string, unknown> = {}) => ({
    event_id: 'evt-default',
    station_id: 'S-default',
    amount: 100,
    status: 'approved',
    created_at: '2026-02-19T10:00:00Z',
    ...overrides,
  });

  // 1 — Batch insert returns correct inserted/duplicates counts
  it('POST /transfers returns correct inserted and duplicates', async () => {
    const res = await request(app.getHttpServer())
      .post('/transfers')
      .send({
        events: [
          makeEvent({ event_id: 't1-a', station_id: 'S-t1' }),
          makeEvent({ event_id: 't1-b', station_id: 'S-t1' }),
          makeEvent({ event_id: 't1-a', station_id: 'S-t1' }), // duplicate in same batch
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ inserted: 2, duplicates: 1 });
  });

  // 2 — Duplicate event_id across requests does not change totals
  it('Duplicate event_id across calls does not change station totals', async () => {
    const event = makeEvent({ event_id: 't2-dup', station_id: 'S-t2', amount: 200 });

    await request(app.getHttpServer()).post('/transfers').send({ events: [event] });
    const second = await request(app.getHttpServer()).post('/transfers').send({ events: [event] });

    expect(second.body).toEqual({ inserted: 0, duplicates: 1 });

    const summary = await request(app.getHttpServer()).get('/stations/S-t2/summary');
    expect(summary.body.total_approved_amount).toBe(200);
    expect(summary.body.events_count).toBe(1);
  });

  // 3 — Out-of-order arrival produces the same totals
  it('Out-of-order created_at still produces correct totals', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .send({
        events: [
          makeEvent({ event_id: 't3-late', station_id: 'S-t3', created_at: '2026-02-19T12:00:00Z', amount: 60 }),
          makeEvent({ event_id: 't3-early', station_id: 'S-t3', created_at: '2026-02-19T08:00:00Z', amount: 140 }),
        ],
      });

    const summary = await request(app.getHttpServer()).get('/stations/S-t3/summary');
    expect(summary.body.total_approved_amount).toBe(200);
    expect(summary.body.events_count).toBe(2);
  });

  // 4 — Concurrent requests with the same event_id do not double-insert
  it('Concurrent POSTs with the same event_id do not double-insert', async () => {
    const payload = {
      events: [makeEvent({ event_id: 't4-conc', station_id: 'S-t4', amount: 300 })],
    };

    const [r1, r2] = await Promise.all([
      request(app.getHttpServer()).post('/transfers').send(payload),
      request(app.getHttpServer()).post('/transfers').send(payload),
    ]);

    expect(r1.body.inserted + r2.body.inserted).toBe(1);
    expect(r1.body.duplicates + r2.body.duplicates).toBe(1);

    const summary = await request(app.getHttpServer()).get('/stations/S-t4/summary');
    expect(summary.body.total_approved_amount).toBe(300);
    expect(summary.body.events_count).toBe(1);
  });

  // 5 — Summary only sums approved; events_count includes all statuses
  it('GET /stations/:id/summary returns correct totals (approved only for amount)', async () => {
    await request(app.getHttpServer())
      .post('/transfers')
      .send({
        events: [
          makeEvent({ event_id: 't5-a', station_id: 'S-t5', amount: 100, status: 'approved' }),
          makeEvent({ event_id: 't5-b', station_id: 'S-t5', amount: 50,  status: 'rejected' }),
          makeEvent({ event_id: 't5-c', station_id: 'S-t5', amount: 75,  status: 'approved' }),
          makeEvent({ event_id: 't5-d', station_id: 'S-t5', amount: 25,  status: 'pending' }),
        ],
      });

    const res = await request(app.getHttpServer()).get('/stations/S-t5/summary');
    expect(res.status).toBe(200);
    expect(res.body.station_id).toBe('S-t5');
    expect(res.body.total_approved_amount).toBe(175); // 100 + 75
    expect(res.body.events_count).toBe(4);            // all statuses
  });

  // 6 — Unknown station returns 404
  it('GET /stations/:id/summary returns 404 for unknown station', async () => {
    const res = await request(app.getHttpServer()).get('/stations/DOES-NOT-EXIST/summary');
    expect(res.status).toBe(404);
  });

  // 7 — Missing required field returns 400
  it('POST /transfers returns 400 when required field is missing', async () => {
    const res = await request(app.getHttpServer())
      .post('/transfers')
      .send({
        events: [
          { station_id: 'S1', amount: 100, status: 'approved', created_at: '2026-02-19T10:00:00Z' }, // no event_id
        ],
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  // 8 — Negative amount returns 400
  it('POST /transfers returns 400 for negative amount', async () => {
    const res = await request(app.getHttpServer())
      .post('/transfers')
      .send({ events: [makeEvent({ event_id: 't8-neg', amount: -10 })] });

    expect(res.status).toBe(400);
  });
});
