const request = require('supertest');

// Mock do banco de dados para CI (sem MySQL)
jest.mock('../src/config/database', () => {
  const mockQuery = jest.fn((sql, params) => {
    if (typeof sql === 'string') {
      if (sql.includes('COUNT(*)')) return Promise.resolve([[{ total: 0 }], []]);
      if (sql.includes('LIMIT')) return Promise.resolve([[], []]);
      if (sql.includes('DELETE FROM')) return Promise.resolve([{ affectedRows: params && params[0] === '99999' ? 0 : 1 }, []]);
      if (sql.includes('WHERE id = ?') && params && params[0] === '99999') return Promise.resolve([[], []]);
      if (sql.includes('SELECT id FROM users WHERE id = ?') && params && params[0] === '99999') return Promise.resolve([[], []]);
    }
    return Promise.resolve([[], []]);
  });
  return { query: mockQuery };
});

const app = require('../src/server');

describe('User Service', () => {
  describe('GET /health', () => {
    it('deve retornar status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(res.body.service).toBe('user-service');
    });
  });

  describe('POST /api/users', () => {
    it('deve rejeitar quando campos obrigatórios não forem fornecidos', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar email inválido', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'email-invalido',
          password: '123456'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar senha muito curta', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({
          name: 'Test User',
          email: 'test@email.com',
          password: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/users', () => {
    it('deve retornar lista de usuários com paginação', async () => {
      const res = await request(app).get('/api/users');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.users)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app).get('/api/users/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app)
        .put('/api/users/99999')
        .send({
          name: 'Updated Name'
        });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('deve rejeitar quando nenhum campo é fornecido', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('deve retornar 404 para ID inexistente', async () => {
      const res = await request(app).delete('/api/users/99999');
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});
