import { checkHealth } from './health.routes';

describe('checkHealth', () => {
  let dbExecute: jest.Mock;
  const check = () => checkHealth({ execute: dbExecute }, Date.now());

  beforeEach(() => {
    dbExecute = jest.fn();
  });

  it('retourne status:ok quand la DB répond', async () => {
    dbExecute.mockResolvedValueOnce([{ '?column?': 1 }]);
    const result = await check();
    expect(result.status).toBe('ok');
    expect(result.db.status).toBe('up');
    expect(typeof result.db.latencyMs).toBe('number');
    expect(result.db.latencyMs).toBeGreaterThanOrEqual(0);
    expect(typeof result.uptime).toBe('number');
    expect(result.version).toBeDefined();
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('retourne status:degraded quand la DB échoue', async () => {
    dbExecute.mockRejectedValueOnce(new Error('connection refused'));
    const result = await check();
    expect(result.status).toBe('degraded');
    expect(result.db.status).toBe('down');
    expect(result.db.latencyMs).toBeNull();
  });
});
