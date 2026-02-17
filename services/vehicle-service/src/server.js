require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const vehicleRoutes = require('./routes/vehicleRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'vehicle-service' });
});

// Rotas
app.use('/api/vehicles', vehicleRoutes);

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Vehicle Service rodando na porta ${PORT}`);
  });
}

module.exports = app;
