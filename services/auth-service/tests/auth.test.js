const request = require('supertest');
const app = require('../src/server');

describe('Auth Service', () => {
  describe('GET /health', () => {
    it('deve retornar status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('auth-service');
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve rejeitar quando email não for fornecido', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'senha123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('obrigatórios');
    });

    it('deve rejeitar quando senha não for fornecida', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@email.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/verify', () => {
    it('deve rejeitar quando token não for fornecido', async () => {
      const res = await request(app)
        .post('/api/auth/verify');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Token não fornecido');
    });

    it('deve rejeitar token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/verify')
        .set('Authorization', 'Bearer token_invalido');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('inválido');
    });
  });
});
