const pool = require('../config/database');
const Joi = require('joi');
const axios = require('axios');

// Schema de validação
const vehicleSchema = Joi.object({
  brand: Joi.string().min(2).max(50).required(),
  model: Joi.string().min(2).max(100).required(),
  year: Joi.number().integer().min(1900).max(2030).required(),
  color: Joi.string().min(3).max(30).required(),
  plate: Joi.string().pattern(/^[A-Z]{3}[0-9]{1}[A-Z0-9]{1}[0-9]{2}$/).required(),
  price: Joi.number().positive().required(),
  status: Joi.string().valid('disponível', 'vendido', 'manutenção').default('disponível')
});

// Middleware para verificar token com auth-service
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Validar token com auth-service
    const response = await axios.post(
      `${process.env.AUTH_SERVICE_URL}/api/auth/verify`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    req.user = response.data.user;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// CREATE - Criar novo veículo
exports.createVehicle = async (req, res) => {
  try {
    const { error, value } = vehicleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { brand, model, year, color, plate, price, status } = value;

    // Verificar se placa já existe
    const [existing] = await pool.query(
      'SELECT id FROM vehicles WHERE plate = ?',
      [plate]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Placa já cadastrada' });
    }

    // Inserir veículo
    const [result] = await pool.query(
      `INSERT INTO vehicles (brand, model, year, color, plate, price, status, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [brand, model, year, color, plate, price, status || 'disponível', req.user.id]
    );

    res.status(201).json({
      message: 'Veículo cadastrado com sucesso',
      vehicle: {
        id: result.insertId,
        brand,
        model,
        year,
        color,
        plate,
        price,
        status: status || 'disponível'
      }
    });
  } catch (error) {
    console.error('Erro ao criar veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// READ - Listar todos os veículos
exports.getVehicles = async (req, res) => {
  try {
    const { status, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (brand) {
      query += ' AND brand LIKE ?';
      params.push(`%${brand}%`);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const [countResult] = await pool.query(countQuery, params);

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [rows] = await pool.query(query, params);

    res.json({
      vehicles: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar veículos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// READ - Buscar veículo por ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({ vehicle: rows[0] });
  } catch (error) {
    console.error('Erro ao buscar veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// UPDATE - Atualizar veículo
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = vehicleSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { brand, model, year, color, plate, price, status } = value;

    // Verificar se veículo existe
    const [existing] = await pool.query('SELECT id FROM vehicles WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    // Verificar se nova placa já existe em outro veículo
    const [duplicate] = await pool.query(
      'SELECT id FROM vehicles WHERE plate = ? AND id != ?',
      [plate, id]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ error: 'Placa já cadastrada em outro veículo' });
    }

    // Atualizar veículo
    await pool.query(
      `UPDATE vehicles 
       SET brand = ?, model = ?, year = ?, color = ?, plate = ?, price = ?, status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [brand, model, year, color, plate, price, status, id]
    );

    res.json({ message: 'Veículo atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// DELETE - Excluir veículo
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Veículo não encontrado' });
    }

    res.json({ message: 'Veículo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir veículo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.verifyToken = verifyToken;
