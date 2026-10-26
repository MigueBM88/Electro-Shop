// ============================================
// ElectroShop - Seed de datos de ejemplo (categorías + productos)
// ============================================
// Uso:  node seedDatos.js
//
// Inserta categorías principales, subcategorías y productos de ejemplo
// para poder probar el catálogo y el panel de admin de inmediato.
//
// Por defecto NO borra nada: si ya existen categorías/productos, avisa
// y no duplica. Para reiniciar desde cero:  node seedDatos.js --reset
// ============================================

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');

const RESET = process.argv.includes('--reset');

// --- Categorías principales ---
const categoriasPrincipales = [
  { nombre: 'Microcontroladores', icono: '🔲', descripcion: 'Placas de desarrollo y microcontroladores' },
  { nombre: 'Sensores', icono: '📡', descripcion: 'Sensores de todo tipo para proyectos' },
  { nombre: 'Componentes Pasivos', icono: '⚡', descripcion: 'Resistencias, capacitores, inductores' },
  { nombre: 'Herramientas', icono: '🛠️', descripcion: 'Herramientas para electrónica' }
];

// --- Subcategorías: { nombrePadre, nombre, icono } ---
const subcategorias = [
  { padre: 'Microcontroladores', nombre: 'Arduino', icono: '🔵' },
  { padre: 'Microcontroladores', nombre: 'ESP / WiFi', icono: '📶' },
  { padre: 'Sensores', nombre: 'Temperatura', icono: '🌡️' },
  { padre: 'Sensores', nombre: 'Movimiento', icono: '🚶' }
];

// --- Productos de ejemplo: categoria = nombre de (sub)categoría ---
const productos = [
  {
    nombre: 'Arduino Uno R3', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-UNO-001',
    precio: 15000, stock: 50, condicion: 'nuevo',
    descripcion: 'Placa de desarrollo Arduino Uno R3 basada en el microcontrolador ATmega328P. Ideal para principiantes.',
    especificaciones: [
      { nombre: 'Voltaje', valor: '5V' },
      { nombre: 'Pines digitales', valor: '14' },
      { nombre: 'Pines analógicos', valor: '6' }
    ]
  },
  {
    nombre: 'Arduino Nano', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-NANO-002',
    precio: 9500, stock: 30, condicion: 'nuevo',
    descripcion: 'Versión compacta del Arduino, perfecta para proyectos con espacio reducido.',
    especificaciones: [{ nombre: 'Voltaje', valor: '5V' }, { nombre: 'Microcontrolador', valor: 'ATmega328P' }]
  },
  {
    nombre: 'ESP32 DevKit V1', categoria: 'ESP / WiFi', marca: 'Espressif', sku: 'ESP-32-003',
    precio: 12000, stock: 40, condicion: 'nuevo',
    descripcion: 'Microcontrolador con WiFi y Bluetooth integrados. Doble núcleo a 240MHz.',
    especificaciones: [{ nombre: 'WiFi', valor: '802.11 b/g/n' }, { nombre: 'Bluetooth', valor: '4.2 BLE' }]
  },
  {
    nombre: 'ESP8266 NodeMCU', categoria: 'ESP / WiFi', marca: 'Espressif', sku: 'ESP-8266-004',
    precio: 7000, stock: 0, condicion: 'nuevo',
    descripcion: 'Módulo WiFi económico para proyectos IoT. Programable con Arduino IDE.',
    especificaciones: [{ nombre: 'WiFi', valor: '802.11 b/g/n' }]
  },
  {
    nombre: 'Sensor DHT22', categoria: 'Temperatura', marca: 'Aosong', sku: 'SEN-DHT22-005',
    precio: 4500, stock: 8, condicion: 'nuevo',
    descripcion: 'Sensor digital de temperatura y humedad de alta precisión.',
    especificaciones: [{ nombre: 'Rango temp.', valor: '-40 a 80°C' }, { nombre: 'Humedad', valor: '0-100% RH' }]
  },
  {
    nombre: 'Sensor PIR HC-SR501', categoria: 'Movimiento', marca: 'Genérico', sku: 'SEN-PIR-006',
    precio: 2500, stock: 60, condicion: 'nuevo',
    descripcion: 'Sensor de movimiento infrarrojo pasivo. Detección hasta 7 metros.',
    especificaciones: [{ nombre: 'Alcance', valor: '7m' }, { nombre: 'Ángulo', valor: '120°' }]
  },
  {
    nombre: 'Multímetro Digital DT-830B', categoria: 'Herramientas', marca: 'Genérico', sku: 'HER-MULT-007',
    precio: 6500, stock: 20, condicion: 'nuevo',
    descripcion: 'Multímetro digital básico para medir voltaje, corriente y resistencia.',
    especificaciones: [{ nombre: 'Pantalla', valor: 'LCD 3.5 dígitos' }]
  },
  {
    nombre: 'Kit Resistencias 1/4W', categoria: 'Componentes Pasivos', marca: 'Genérico', sku: 'CP-RES-008',
    precio: 3500, stock: 100, condicion: 'nuevo',
    descripcion: 'Kit de 600 resistencias surtidas de 1/4W, 30 valores distintos.',
    especificaciones: [{ nombre: 'Cantidad', valor: '600 piezas' }, { nombre: 'Tolerancia', valor: '±5%' }]
  },
  {
    nombre: 'Arduino Mega 2560 (reacondicionado)', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-MEGA-009',
    precio: 18000, precioOriginal: 25000, stock: 5, condicion: 'reacondicionado',
    descripcion: 'Arduino Mega 2560 reacondicionado, probado y funcional. 54 pines digitales.',
    especificaciones: [{ nombre: 'Pines digitales', valor: '54' }, { nombre: 'Memoria', valor: '256 KB' }]
  }
];

async function seed() {
  await connectDB();

  try {
    if (RESET) {
      await Producto.deleteMany({});
      await Categoria.deleteMany({});
      console.log('🗑️  Datos previos eliminados (--reset)');
    } else {
      const existentes = await Categoria.countDocuments();
      if (existentes > 0) {
        console.log(`⚠️  Ya existen ${existentes} categorías. Para reiniciar desde cero usa:  node seedDatos.js --reset`);
        console.log('    (No se insertó nada para evitar duplicados.)');
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    // 1) Crear categorías principales y mapear nombre -> _id
    const mapaCategorias = {};
    for (const c of categoriasPrincipales) {
      const doc = await Categoria.create({ ...c, padre: null, activa: true });
      mapaCategorias[c.nombre] = doc._id;
    }
    console.log(`✅ ${categoriasPrincipales.length} categorías principales creadas`);

    // 2) Crear subcategorías
    for (const s of subcategorias) {
      const doc = await Categoria.create({
        nombre: s.nombre, icono: s.icono, activa: true,
        padre: mapaCategorias[s.padre]
      });
      mapaCategorias[s.nombre] = doc._id;
    }
    console.log(`✅ ${subcategorias.length} subcategorías creadas`);

    // 3) Crear productos
    let creados = 0;
    for (const p of productos) {
      const catId = mapaCategorias[p.categoria];
      if (!catId) {
        console.log(`   ⚠️  Categoría no encontrada para "${p.nombre}": ${p.categoria} (omitido)`);
        continue;
      }
      await Producto.create({ ...p, categoria: catId, activo: true });
      creados++;
    }
    console.log(`✅ ${creados} productos creados`);

    console.log('\n🎉 Seed completado. Ya puedes ver el catálogo y probar el panel de admin.');
  } catch (error) {
    console.error('❌ Error en el seed:', error.message);
    if (error.errors) Object.values(error.errors).forEach((e) => console.error('   -', e.message));
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
