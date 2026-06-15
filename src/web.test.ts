import request from 'supertest';

jest.mock('./claude', () => ({
  generateRoutine: jest.fn(),
  generateNextWeekRoutine: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app } = require('./web') as typeof import('./web');

describe('GET /', () => {
  it('홈 화면에 200 응답이 반환된다', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});
