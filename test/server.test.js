const request = require('supertest');
const app = require('../server');

describe('Hello World App', () => {
  describe('GET /', () => {
    it('should return HTML page with Hello World', async () => {
      const res = await request(app).get('/');
      
      expect(res.status).toBe(200);
      expect(res.type).toBe('text/html');
      expect(res.text).toContain('Hello World');
      expect(res.text).toContain('<h1>Hello World</h1>');
    });

    it('should have proper HTML structure', async () => {
      const res = await request(app).get('/');
      
      expect(res.text).toContain('<!DOCTYPE html>');
      expect(res.text).toContain('<html>');
      expect(res.text).toContain('<title>Hello World</title>');
      expect(res.text).toContain('</html>');
    });
  });
});
