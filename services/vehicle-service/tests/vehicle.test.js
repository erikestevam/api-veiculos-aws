const request = require('supertest');
const app = require('../src/server');

describe('Vehicle Service', () => {
  describe('GET /health', () => {
    it('deve retornar status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('vehicle-service');
    });
  });

  describe('POST /api/vehicles', () => {
    it('deve rejeitar requisição sem token de autorização', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Prata',
          plate: 'ABC1D23',
          price: 95000
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Token');
    });

    it('deve rejeitar quando campos obrigatórios não forem fornecidos', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer token-invalido')
        .send({
          brand: 'Toyota'
        });

      expect(res.statusCode).toBe(401);
    });

    it('deve rejeitar placa em formato inválido', async () => {
      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', 'Bearer token-invalido')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Prata',
          plate: 'PLACA-INVALIDA',
          price: 95000
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles', () => {
    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app).get('/api/vehicles');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app).get('/api/vehicles/1');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app)
        .put('/api/vehicles/1')
        .send({
          brand: 'Toyota',
          model: 'Corolla',
          year: 2023,
          color: 'Preto',
          plate: 'ABC1D23',
          price: 90000
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app).delete('/api/vehicles/1');
      expect(res.statusCode).toBe(401);
    });
  });
});
