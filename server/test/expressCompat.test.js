// Guards the Express 5 upgrade: what Express 4 did implicitly and this app relies on.
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const request = require('supertest');
const restoreQuery = require('../middleware/restoreQuery');
const { app } = require('../app');

describe('req.query under Express 5', () => {
  const mini = () => {
    const a = express();
    a.use(restoreQuery);
    a.use(mongoSanitize());
    a.get('/q', (req, res) => res.json(req.query));
    return a;
  };

  it('is sanitised: $-prefixed and dotted keys are dropped, ordinary ones kept', async () => {
    const res = await request(mini()).get('/q?$where=1&a.b=2&ok=fine');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 'fine' });
  });

  it('strips an operator that the query parser turned into an object', async () => {
    const a = express();
    a.set('query parser', 'extended');
    a.use(restoreQuery);
    a.use(mongoSanitize());
    a.get('/q', (req, res) => res.json(req.query));
    const res = await request(a).get('/q?email[$ne]=x');
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('$ne');
  });

  it('without restoreQuery, express-mongo-sanitize cannot run at all (why the shim exists)', async () => {
    const a = express();
    a.use(mongoSanitize());
    a.get('/q', (req, res) => res.json(req.query));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect((await request(a).get('/q?ok=1')).status).toBe(500);
    } finally { spy.mockRestore(); }
  });
});

describe('the real app', () => {
  it('serves a request whose query has $ and dotted keys (does not 500)', async () => {
    const res = await request(app).get('/api/health?$where=1&a.b=2');
    expect(res.status).toBe(200);
  });

  it('answers a POST with no body at all with a client error, not a 500', async () => {
    const res = await request(app).post('/api/auth/login');
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('does not let an operator object in the body act as a password or email match', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.body.token).toBeUndefined();
  });
});
