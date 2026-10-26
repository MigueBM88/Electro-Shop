// ============================================
// ElectroShop - Script de creación del primer ADMIN (seed)
// ============================================
// Uso:  node seedAdmin.js
//
// Crea un usuario administrador inicial en la base de datos.
// Si el correo ya existe, lo promueve a rol 'admin'.
// La contraseña se hashea automáticamente (hook pre('save') del modelo User).
//
// Puedes sobreescribir los valores por variables de entorno:
//   ADMIN_NOMBRE, ADMIN_CORREO, ADMIN_PASSWORD
// ============================================

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

// --- Datos del admin (cambia estos valores si quieres) ---
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE || 'Administrador';
const ADMIN_CORREO = (process.env.ADMIN_CORREO || 'admin@electroshop.com').toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234'; // mínimo 8 caracteres

async function crearAdmin() {
  await connectDB();

  try {
    const existente = await User.findOne({ correo: ADMIN_CORREO }).select('+contrasena');

    if (existente) {
      // Ya existe: lo promovemos a admin y lo dejamos activo/confirmado
      existente.rol = 'admin';
      existente.activo = true;
      existente.correoConfirmado = true;
      // Si quieres resetear también la contraseña, descomenta la línea siguiente:
      // existente.contrasena = ADMIN_PASSWORD;
      await existente.save();

      console.log('✅ Usuario existente actualizado a ADMIN');
      console.log('   Correo:', ADMIN_CORREO);
      console.log('   (La contraseña NO se cambió. Usa la que ya tenías para este correo.)');
    } else {
      // No existe: lo creamos desde cero
      await User.create({
        nombre: ADMIN_NOMBRE,
        correo: ADMIN_CORREO,
        contrasena: ADMIN_PASSWORD,
        rol: 'admin',
        activo: true,
        correoConfirmado: true
      });

      console.log('✅ Admin creado correctamente');
      console.log('   Correo:    ', ADMIN_CORREO);
      console.log('   Contraseña:', ADMIN_PASSWORD);
    }

    console.log('\n👉 Ya puedes iniciar sesión en el frontend con estas credenciales.');
  } catch (error) {
    console.error('❌ Error al crear el admin:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) => console.error('   -', e.message));
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

crearAdmin();
