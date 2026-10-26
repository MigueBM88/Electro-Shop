const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTAS
// ============================================

// Rutas de Autenticación (HU-1: Registro, HU-2: Login, HU-3: Perfil)
app.use('/api/auth', require('./routes/authRoutes'));

// Rutas de Administración de Usuarios (Panel Administrativo HU-2)
app.use('/api/admin/users', require('./routes/adminUserRoutes'));

// Rutas de Categorías (público + admin)
app.use('/api/categorias', require('./routes/categoriaRoutes'));

// Rutas de Productos (público + admin)
app.use('/api/productos', require('./routes/productoRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: '🔌 API de ElectroShop funcionando correctamente',
    version: '1.0.0',
    documentacion: '/api'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ exito: false, mensaje: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    exito: false,
    mensaje: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ElectroShop corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.NODE_ENV}`);
});
