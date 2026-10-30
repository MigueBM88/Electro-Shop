// ============================================
// ElectroShop - Seed de datos de ejemplo (categorías + productos)
// ============================================
// Uso:
//   node seedDatos.js          -> agrega lo que falte (no duplica, usa nombre/SKU)
//   node seedDatos.js --reset  -> borra categorías y productos y carga todo de cero
//
// Solo crea productos de la tienda (vendedor = null).
// Vendedores externos y Trade-In se manejan manualmente.
// ============================================

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Categoria = require('./models/Categoria');
const Producto = require('./models/Producto');

const RESET = process.argv.includes('--reset');

// Helper para especificaciones: spec('Voltaje', '5V')
const spec = (nombre, valor) => ({ nombre, valor });

// ============================================
// CATEGORÍAS PRINCIPALES
// ============================================
const categoriasPrincipales = [
  { nombre: 'Microcontroladores', icono: '🔲', descripcion: 'Placas de desarrollo y microcontroladores' },
  { nombre: 'Sensores', icono: '📡', descripcion: 'Sensores de todo tipo para proyectos' },
  { nombre: 'Componentes Pasivos', icono: '⚡', descripcion: 'Resistencias, capacitores, inductores' },
  { nombre: 'Semiconductores', icono: '🔺', descripcion: 'Transistores, diodos, LEDs y circuitos integrados' },
  { nombre: 'Módulos y Prototipado', icono: '🧩', descripcion: 'Protoboards, cables, módulos y displays' },
  { nombre: 'Herramientas', icono: '🛠️', descripcion: 'Herramientas para electrónica' }
];

// ============================================
// SUBCATEGORÍAS { padre, nombre, icono }
// ============================================
const subcategorias = [
  { padre: 'Microcontroladores', nombre: 'Arduino', icono: '🔵' },
  { padre: 'Microcontroladores', nombre: 'ESP / WiFi', icono: '📶' },
  { padre: 'Sensores', nombre: 'Temperatura', icono: '🌡️' },
  { padre: 'Sensores', nombre: 'Movimiento', icono: '🚶' },

  { padre: 'Componentes Pasivos', nombre: 'Resistencias', icono: '〰️' },
  { padre: 'Componentes Pasivos', nombre: 'Capacitores', icono: '🔋' },
  { padre: 'Componentes Pasivos', nombre: 'Bobinas e Inductores', icono: '🌀' },
  { padre: 'Componentes Pasivos', nombre: 'Potenciómetros', icono: '🎚️' },

  { padre: 'Semiconductores', nombre: 'Transistores', icono: '🔺' },
  { padre: 'Semiconductores', nombre: 'Diodos y LEDs', icono: '💡' },
  { padre: 'Semiconductores', nombre: 'Circuitos Integrados', icono: '🧠' },
  { padre: 'Semiconductores', nombre: 'Reguladores de Voltaje', icono: '🔌' },

  { padre: 'Módulos y Prototipado', nombre: 'Protoboards y Cables', icono: '🧷' },
  { padre: 'Módulos y Prototipado', nombre: 'Displays', icono: '🖥️' },

  { padre: 'Herramientas', nombre: 'Multímetros', icono: '📟' },
  { padre: 'Herramientas', nombre: 'Fuentes de Poder', icono: '🔋' },
  { padre: 'Herramientas', nombre: 'Soldadura', icono: '🔥' },
  { padre: 'Herramientas', nombre: 'Herramientas de Mano', icono: '🔧' },
  { padre: 'Herramientas', nombre: 'Instrumentos de Medición', icono: '📈' }
];

// ============================================
// PRODUCTOS (categoria = nombre de la (sub)categoría)
// Precios en colones (₡)
// ============================================
const productos = [
  // ---------- Originales ----------
  {
    nombre: 'Arduino Uno R3', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-UNO-001',
    precio: 15000, stock: 50, condicion: 'nuevo',
    descripcion: 'Placa de desarrollo Arduino Uno R3 basada en el microcontrolador ATmega328P. Ideal para principiantes.',
    especificaciones: [spec('Voltaje', '5V'), spec('Pines digitales', '14'), spec('Pines analógicos', '6')]
  },
  {
    nombre: 'Arduino Nano', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-NANO-002',
    precio: 9500, stock: 30, condicion: 'nuevo',
    descripcion: 'Versión compacta del Arduino, perfecta para proyectos con espacio reducido.',
    especificaciones: [spec('Voltaje', '5V'), spec('Microcontrolador', 'ATmega328P')]
  },
  {
    nombre: 'ESP32 DevKit V1', categoria: 'ESP / WiFi', marca: 'Espressif', sku: 'ESP-32-003',
    precio: 12000, stock: 40, condicion: 'nuevo',
    descripcion: 'Microcontrolador con WiFi y Bluetooth integrados. Doble núcleo a 240MHz.',
    especificaciones: [spec('WiFi', '802.11 b/g/n'), spec('Bluetooth', '4.2 BLE')]
  },
  {
    nombre: 'ESP8266 NodeMCU', categoria: 'ESP / WiFi', marca: 'Espressif', sku: 'ESP-8266-004',
    precio: 7000, stock: 0, condicion: 'nuevo',
    descripcion: 'Módulo WiFi económico para proyectos IoT. Programable con Arduino IDE.',
    especificaciones: [spec('WiFi', '802.11 b/g/n')]
  },
  {
    nombre: 'Sensor DHT22', categoria: 'Temperatura', marca: 'Aosong', sku: 'SEN-DHT22-005',
    precio: 4500, stock: 8, condicion: 'nuevo',
    descripcion: 'Sensor digital de temperatura y humedad de alta precisión.',
    especificaciones: [spec('Rango temp.', '-40 a 80°C'), spec('Humedad', '0-100% RH')]
  },
  {
    nombre: 'Sensor PIR HC-SR501', categoria: 'Movimiento', marca: 'Genérico', sku: 'SEN-PIR-006',
    precio: 2500, stock: 60, condicion: 'nuevo',
    descripcion: 'Sensor de movimiento infrarrojo pasivo. Detección hasta 7 metros.',
    especificaciones: [spec('Alcance', '7m'), spec('Ángulo', '120°')]
  },
  {
    nombre: 'Multímetro Digital DT-830B', categoria: 'Multímetros', marca: 'Genérico', sku: 'HER-MULT-007',
    precio: 6500, stock: 20, condicion: 'nuevo',
    descripcion: 'Multímetro digital básico para medir voltaje, corriente y resistencia.',
    especificaciones: [spec('Pantalla', 'LCD 3.5 dígitos')]
  },
  {
    nombre: 'Kit Resistencias 1/4W', categoria: 'Resistencias', marca: 'Genérico', sku: 'CP-RES-008',
    precio: 3500, stock: 100, condicion: 'nuevo',
    descripcion: 'Kit de 600 resistencias surtidas de 1/4W, 30 valores distintos.',
    especificaciones: [spec('Cantidad', '600 piezas'), spec('Tolerancia', '±5%')]
  },
  {
    nombre: 'Arduino Mega 2560 (reacondicionado)', categoria: 'Arduino', marca: 'Arduino', sku: 'ARD-MEGA-009',
    precio: 18000, precioOriginal: 25000, stock: 5, condicion: 'reacondicionado',
    descripcion: 'Arduino Mega 2560 reacondicionado, probado y funcional. 54 pines digitales.',
    especificaciones: [spec('Pines digitales', '54'), spec('Memoria', '256 KB')]
  },

  // ---------- Resistencias ----------
  ...[
    ['10Ω', 'RES-10R'], ['100Ω', 'RES-100R'], ['220Ω', 'RES-220R'], ['330Ω', 'RES-330R'],
    ['1kΩ', 'RES-1K'], ['4.7kΩ', 'RES-4K7'], ['10kΩ', 'RES-10K'], ['100kΩ', 'RES-100K'], ['1MΩ', 'RES-1M']
  ].map(([valor, sku]) => ({
    nombre: `Resistencia ${valor} 1/4W (paquete 20)`, categoria: 'Resistencias', marca: 'Genérico', sku: `CP-${sku}`,
    precio: 500, stock: 200, condicion: 'nuevo',
    descripcion: `Paquete de 20 resistencias de película de carbón de ${valor}, 1/4W. Uso general en protoboard.`,
    especificaciones: [spec('Valor', valor), spec('Potencia', '0.25W'), spec('Tolerancia', '±5%'), spec('Cantidad', '20 piezas')]
  })),
  {
    nombre: 'Resistencia de Potencia 10Ω 5W', categoria: 'Resistencias', marca: 'Genérico', sku: 'CP-RES-10R-5W',
    precio: 400, stock: 80, condicion: 'nuevo',
    descripcion: 'Resistencia cerámica de alambre para cargas de potencia y limitación de corriente.',
    especificaciones: [spec('Valor', '10Ω'), spec('Potencia', '5W'), spec('Tolerancia', '±5%')]
  },

  // ---------- Capacitores ----------
  {
    nombre: 'Capacitor Cerámico 100nF (paquete 20)', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-100NF',
    precio: 700, stock: 150, condicion: 'nuevo',
    descripcion: 'Capacitores cerámicos 104 de 100nF, ideales para desacople de circuitos integrados.',
    especificaciones: [spec('Capacitancia', '100nF (104)'), spec('Voltaje', '50V'), spec('Cantidad', '20 piezas')]
  },
  {
    nombre: 'Capacitor Cerámico 22pF (paquete 20)', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-22PF',
    precio: 600, stock: 120, condicion: 'nuevo',
    descripcion: 'Capacitores de 22pF para osciladores de cristal en microcontroladores.',
    especificaciones: [spec('Capacitancia', '22pF'), spec('Voltaje', '50V'), spec('Cantidad', '20 piezas')]
  },
  {
    nombre: 'Capacitor Electrolítico 10µF 25V (paquete 10)', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-10UF',
    precio: 800, stock: 100, condicion: 'nuevo',
    descripcion: 'Capacitores electrolíticos de aluminio para filtrado y acople.',
    especificaciones: [spec('Capacitancia', '10µF'), spec('Voltaje', '25V'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Capacitor Electrolítico 100µF 25V (paquete 10)', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-100UF',
    precio: 1000, stock: 100, condicion: 'nuevo',
    descripcion: 'Capacitores electrolíticos para filtrado de fuentes de alimentación.',
    especificaciones: [spec('Capacitancia', '100µF'), spec('Voltaje', '25V'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Capacitor Electrolítico 1000µF 16V', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-1000UF',
    precio: 450, stock: 70, condicion: 'nuevo',
    descripcion: 'Capacitor de alta capacitancia para filtrado de rizado en fuentes.',
    especificaciones: [spec('Capacitancia', '1000µF'), spec('Voltaje', '16V')]
  },
  {
    nombre: 'Kit Capacitores Electrolíticos (120 piezas)', categoria: 'Capacitores', marca: 'Genérico', sku: 'CP-CAP-KIT',
    precio: 4500, stock: 25, condicion: 'nuevo',
    descripcion: 'Surtido de 12 valores de 1µF a 470µF en caja organizadora.',
    especificaciones: [spec('Rango', '1µF - 470µF'), spec('Valores', '12'), spec('Cantidad', '120 piezas')]
  },

  // ---------- Bobinas e inductores ----------
  {
    nombre: 'Inductor Axial 10µH (paquete 10)', categoria: 'Bobinas e Inductores', marca: 'Genérico', sku: 'CP-IND-10UH',
    precio: 900, stock: 80, condicion: 'nuevo',
    descripcion: 'Inductores axiales tipo resistencia para filtros y circuitos de RF.',
    especificaciones: [spec('Inductancia', '10µH'), spec('Corriente', '0.5A'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Inductor Radial 100µH 1A', categoria: 'Bobinas e Inductores', marca: 'Genérico', sku: 'CP-IND-100UH',
    precio: 350, stock: 90, condicion: 'nuevo',
    descripcion: 'Bobina radial de potencia para convertidores DC-DC tipo buck/boost.',
    especificaciones: [spec('Inductancia', '100µH'), spec('Corriente', '1A')]
  },
  {
    nombre: 'Bobina Toroidal 330µH 3A', categoria: 'Bobinas e Inductores', marca: 'Genérico', sku: 'CP-IND-TOR-330',
    precio: 1200, stock: 40, condicion: 'nuevo',
    descripcion: 'Inductor toroidal de núcleo de ferrita para fuentes conmutadas (ej. LM2596).',
    especificaciones: [spec('Inductancia', '330µH'), spec('Corriente', '3A'), spec('Núcleo', 'Ferrita toroidal')]
  },
  {
    nombre: 'Kit Inductores Axiales (100 piezas)', categoria: 'Bobinas e Inductores', marca: 'Genérico', sku: 'CP-IND-KIT',
    precio: 3800, stock: 20, condicion: 'nuevo',
    descripcion: 'Surtido de 10 valores de 1µH a 1mH.',
    especificaciones: [spec('Rango', '1µH - 1mH'), spec('Valores', '10'), spec('Cantidad', '100 piezas')]
  },

  // ---------- Potenciómetros ----------
  {
    nombre: 'Potenciómetro 10kΩ Lineal', categoria: 'Potenciómetros', marca: 'Genérico', sku: 'CP-POT-10K',
    precio: 400, stock: 120, condicion: 'nuevo',
    descripcion: 'Potenciómetro rotativo de 10kΩ con eje, ideal para entradas analógicas de Arduino.',
    especificaciones: [spec('Valor', '10kΩ'), spec('Curva', 'Lineal (B)')]
  },
  {
    nombre: 'Trimmer Multivuelta 10kΩ 3296W (paquete 5)', categoria: 'Potenciómetros', marca: 'Bourns', sku: 'CP-TRIM-10K',
    precio: 1500, stock: 60, condicion: 'nuevo',
    descripcion: 'Potenciómetro de precisión de 25 vueltas para calibración.',
    especificaciones: [spec('Valor', '10kΩ'), spec('Vueltas', '25'), spec('Cantidad', '5 piezas')]
  },

  // ---------- Transistores ----------
  {
    nombre: 'Transistor 2N2222A NPN (paquete 10)', categoria: 'Transistores', marca: 'Genérico', sku: 'SEM-2N2222',
    precio: 800, stock: 150, condicion: 'nuevo',
    descripcion: 'Transistor NPN de propósito general para conmutación y amplificación.',
    especificaciones: [spec('Tipo', 'NPN'), spec('Ic máx.', '800mA'), spec('Encapsulado', 'TO-92'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Transistor BC547 NPN (paquete 10)', categoria: 'Transistores', marca: 'Genérico', sku: 'SEM-BC547',
    precio: 600, stock: 150, condicion: 'nuevo',
    descripcion: 'Transistor NPN de baja señal, muy común en circuitos de práctica.',
    especificaciones: [spec('Tipo', 'NPN'), spec('Ic máx.', '100mA'), spec('Encapsulado', 'TO-92'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Transistor BC557 PNP (paquete 10)', categoria: 'Transistores', marca: 'Genérico', sku: 'SEM-BC557',
    precio: 600, stock: 150, condicion: 'nuevo',
    descripcion: 'Transistor PNP complementario del BC547.',
    especificaciones: [spec('Tipo', 'PNP'), spec('Ic máx.', '100mA'), spec('Encapsulado', 'TO-92'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Transistor TIP120 Darlington NPN', categoria: 'Transistores', marca: 'STMicroelectronics', sku: 'SEM-TIP120',
    precio: 600, stock: 80, condicion: 'nuevo',
    descripcion: 'Darlington de potencia para manejar motores, relés y tiras LED desde Arduino.',
    especificaciones: [spec('Tipo', 'NPN Darlington'), spec('Ic máx.', '5A'), spec('Encapsulado', 'TO-220')]
  },
  {
    nombre: 'MOSFET IRF540N Canal N', categoria: 'Transistores', marca: 'Infineon', sku: 'SEM-IRF540N',
    precio: 900, stock: 60, condicion: 'nuevo',
    descripcion: 'MOSFET de potencia para conmutación de cargas de alta corriente.',
    especificaciones: [spec('Tipo', 'MOSFET canal N'), spec('Id máx.', '33A'), spec('Vds', '100V'), spec('Encapsulado', 'TO-220')]
  },
  {
    nombre: 'Kit Transistores Surtidos (200 piezas)', categoria: 'Transistores', marca: 'Genérico', sku: 'SEM-TRAN-KIT',
    precio: 5500, stock: 20, condicion: 'nuevo',
    descripcion: 'Surtido de 10 modelos NPN y PNP (2N2222, 2N3904, 2N3906, BC547, BC557, S8050, entre otros).',
    especificaciones: [spec('Modelos', '10'), spec('Cantidad', '200 piezas')]
  },

  // ---------- Diodos y LEDs ----------
  {
    nombre: 'Diodo Rectificador 1N4007 (paquete 20)', categoria: 'Diodos y LEDs', marca: 'Genérico', sku: 'SEM-1N4007',
    precio: 700, stock: 200, condicion: 'nuevo',
    descripcion: 'Diodo de 1A 1000V para rectificación y protección contra polaridad inversa.',
    especificaciones: [spec('Corriente', '1A'), spec('Voltaje inverso', '1000V'), spec('Cantidad', '20 piezas')]
  },
  {
    nombre: 'Diodo Zener 5.1V 1/2W (paquete 10)', categoria: 'Diodos y LEDs', marca: 'Genérico', sku: 'SEM-ZEN-5V1',
    precio: 600, stock: 100, condicion: 'nuevo',
    descripcion: 'Diodo zener para referencia y regulación simple de voltaje.',
    especificaciones: [spec('Voltaje zener', '5.1V'), spec('Potencia', '0.5W'), spec('Cantidad', '10 piezas')]
  },
  {
    nombre: 'Kit LEDs 5mm Surtidos (100 piezas)', categoria: 'Diodos y LEDs', marca: 'Genérico', sku: 'SEM-LED-KIT',
    precio: 2000, stock: 60, condicion: 'nuevo',
    descripcion: 'LEDs de 5mm en rojo, verde, azul, amarillo y blanco.',
    especificaciones: [spec('Tamaño', '5mm'), spec('Colores', '5'), spec('Cantidad', '100 piezas')]
  },
  {
    nombre: 'LED RGB 5mm Cátodo Común (paquete 5)', categoria: 'Diodos y LEDs', marca: 'Genérico', sku: 'SEM-LED-RGB',
    precio: 1000, stock: 80, condicion: 'nuevo',
    descripcion: 'LED de 4 patas para mezcla de colores con PWM.',
    especificaciones: [spec('Tipo', 'Cátodo común'), spec('Cantidad', '5 piezas')]
  },

  // ---------- Circuitos integrados ----------
  {
    nombre: 'Temporizador NE555 (paquete 5)', categoria: 'Circuitos Integrados', marca: 'Texas Instruments', sku: 'IC-NE555',
    precio: 1000, stock: 100, condicion: 'nuevo',
    descripcion: 'El clásico temporizador 555 para osciladores, PWM y circuitos astables/monoestables.',
    especificaciones: [spec('Encapsulado', 'DIP-8'), spec('Voltaje', '4.5V - 16V'), spec('Cantidad', '5 piezas')]
  },
  {
    nombre: 'Amplificador Operacional LM358', categoria: 'Circuitos Integrados', marca: 'Texas Instruments', sku: 'IC-LM358',
    precio: 300, stock: 100, condicion: 'nuevo',
    descripcion: 'Doble amplificador operacional de alimentación simple.',
    especificaciones: [spec('Canales', '2'), spec('Encapsulado', 'DIP-8')]
  },
  {
    nombre: 'Driver de Motores L293D', categoria: 'Circuitos Integrados', marca: 'STMicroelectronics', sku: 'IC-L293D',
    precio: 1200, stock: 50, condicion: 'nuevo',
    descripcion: 'Puente H doble para controlar 2 motores DC o 1 motor paso a paso.',
    especificaciones: [spec('Corriente por canal', '600mA'), spec('Encapsulado', 'DIP-16')]
  },
  {
    nombre: 'Optoacoplador PC817 (paquete 5)', categoria: 'Circuitos Integrados', marca: 'Sharp', sku: 'IC-PC817',
    precio: 800, stock: 80, condicion: 'nuevo',
    descripcion: 'Aislamiento galvánico entre circuitos de control y potencia.',
    especificaciones: [spec('Aislamiento', '5000V'), spec('Encapsulado', 'DIP-4'), spec('Cantidad', '5 piezas')]
  },

  // ---------- Reguladores de voltaje ----------
  {
    nombre: 'Regulador LM7805 5V 1A', categoria: 'Reguladores de Voltaje', marca: 'STMicroelectronics', sku: 'REG-7805',
    precio: 350, stock: 120, condicion: 'nuevo',
    descripcion: 'Regulador lineal fijo de 5V.',
    especificaciones: [spec('Salida', '5V'), spec('Corriente', '1A'), spec('Encapsulado', 'TO-220')]
  },
  {
    nombre: 'Regulador AMS1117 3.3V', categoria: 'Reguladores de Voltaje', marca: 'AMS', sku: 'REG-AMS1117',
    precio: 300, stock: 100, condicion: 'nuevo',
    descripcion: 'Regulador LDO de 3.3V para ESP32, ESP8266 y sensores.',
    especificaciones: [spec('Salida', '3.3V'), spec('Corriente', '800mA'), spec('Encapsulado', 'SOT-223')]
  },
  {
    nombre: 'Módulo Step-Down LM2596 Ajustable', categoria: 'Reguladores de Voltaje', marca: 'Genérico', sku: 'REG-LM2596',
    precio: 1800, stock: 50, condicion: 'nuevo',
    descripcion: 'Convertidor DC-DC reductor de alta eficiencia con salida ajustable.',
    especificaciones: [spec('Entrada', '4V - 40V'), spec('Salida', '1.25V - 37V'), spec('Corriente', '3A')]
  },

  // ---------- Protoboards, cables y displays ----------
  {
    nombre: 'Protoboard 830 Puntos', categoria: 'Protoboards y Cables', marca: 'Genérico', sku: 'PRO-PB-830',
    precio: 2500, stock: 70, condicion: 'nuevo',
    descripcion: 'Protoboard sin soldadura con base adhesiva.',
    especificaciones: [spec('Puntos', '830'), spec('Dimensiones', '165 x 55 mm')]
  },
  {
    nombre: 'Cables Dupont Macho-Macho (40 piezas)', categoria: 'Protoboards y Cables', marca: 'Genérico', sku: 'PRO-DUP-MM',
    precio: 1200, stock: 100, condicion: 'nuevo',
    descripcion: 'Cables jumper de 20cm para conexiones en protoboard.',
    especificaciones: [spec('Largo', '20cm'), spec('Tipo', 'Macho-Macho'), spec('Cantidad', '40 piezas')]
  },
  {
    nombre: 'Módulo Relé 5V 2 Canales', categoria: 'Protoboards y Cables', marca: 'Genérico', sku: 'PRO-RELE-2CH',
    precio: 2200, stock: 45, condicion: 'nuevo',
    descripcion: 'Módulo de relés optoacoplado para controlar cargas de 110V/220V.',
    especificaciones: [spec('Canales', '2'), spec('Carga máx.', '10A 250VAC')]
  },
  {
    nombre: 'Display LCD 16x2 con I2C', categoria: 'Displays', marca: 'Genérico', sku: 'DIS-LCD1602',
    precio: 3500, stock: 40, condicion: 'nuevo',
    descripcion: 'Pantalla LCD de 16x2 con retroiluminación azul y adaptador I2C incluido.',
    especificaciones: [spec('Caracteres', '16x2'), spec('Interfaz', 'I2C'), spec('Voltaje', '5V')]
  },
  {
    nombre: 'Display OLED 0.96" 128x64 I2C', categoria: 'Displays', marca: 'Genérico', sku: 'DIS-OLED096',
    precio: 3200, stock: 35, condicion: 'nuevo',
    descripcion: 'Pantalla OLED monocromática de alto contraste, driver SSD1306.',
    especificaciones: [spec('Resolución', '128x64'), spec('Driver', 'SSD1306'), spec('Interfaz', 'I2C')]
  },

  // ---------- Multímetros ----------
  {
    nombre: 'Multímetro Digital UNI-T UT33D+', categoria: 'Multímetros', marca: 'UNI-T', sku: 'HER-MULT-UT33D',
    precio: 14500, stock: 15, condicion: 'nuevo',
    descripcion: 'Multímetro compacto con detección de voltaje sin contacto (NCV) y prueba de continuidad.',
    especificaciones: [spec('Cuentas', '2000'), spec('Voltaje DC', '600V'), spec('Funciones', 'V, A, Ω, NCV, diodo')]
  },
  {
    nombre: 'Multímetro True RMS UNI-T UT61E+', categoria: 'Multímetros', marca: 'UNI-T', sku: 'HER-MULT-UT61E',
    precio: 42000, stock: 8, condicion: 'nuevo',
    descripcion: 'Multímetro de alta precisión True RMS con medición de capacitancia y frecuencia.',
    especificaciones: [spec('Cuentas', '22000'), spec('True RMS', 'Sí'), spec('Funciones', 'V, A, Ω, F, Hz, °C')]
  },
  {
    nombre: 'Multímetro Fluke 117', categoria: 'Multímetros', marca: 'Fluke', sku: 'HER-MULT-F117',
    precio: 135000, stock: 4, condicion: 'nuevo',
    descripcion: 'Multímetro profesional True RMS para electricistas, con VoltAlert sin contacto.',
    especificaciones: [spec('Cuentas', '6000'), spec('Categoría', 'CAT III 600V'), spec('True RMS', 'Sí')]
  },
  {
    nombre: 'Pinza Amperimétrica UNI-T UT210E', categoria: 'Multímetros', marca: 'UNI-T', sku: 'HER-PINZA-210E',
    precio: 28000, stock: 10, condicion: 'nuevo',
    descripcion: 'Pinza para medir corriente AC/DC sin abrir el circuito.',
    especificaciones: [spec('Corriente', '100A AC/DC'), spec('True RMS', 'Sí')]
  },

  // ---------- Fuentes de poder ----------
  {
    nombre: 'Fuente de Laboratorio 30V 5A', categoria: 'Fuentes de Poder', marca: 'Korad', sku: 'HER-FUE-3005',
    precio: 55000, stock: 6, condicion: 'nuevo',
    descripcion: 'Fuente DC regulada ajustable con pantalla digital de voltaje y corriente.',
    especificaciones: [spec('Voltaje', '0 - 30V'), spec('Corriente', '0 - 5A'), spec('Canales', '1')]
  },
  {
    nombre: 'Fuente de Laboratorio Programable 30V 10A', categoria: 'Fuentes de Poder', marca: 'Korad', sku: 'HER-FUE-3010P',
    precio: 98000, stock: 3, condicion: 'nuevo',
    descripcion: 'Fuente programable con memorias, protección OVP/OCP y puerto USB.',
    especificaciones: [spec('Voltaje', '0 - 30V'), spec('Corriente', '0 - 10A'), spec('Interfaz', 'USB')]
  },
  {
    nombre: 'Adaptador de Corriente 12V 2A', categoria: 'Fuentes de Poder', marca: 'Genérico', sku: 'HER-ADP-12V2A',
    precio: 3500, stock: 40, condicion: 'nuevo',
    descripcion: 'Eliminador de pared con conector jack 5.5mm compatible con Arduino.',
    especificaciones: [spec('Salida', '12V DC 2A'), spec('Conector', '5.5 x 2.1 mm')]
  },
  {
    nombre: 'Módulo Fuente para Protoboard MB102', categoria: 'Fuentes de Poder', marca: 'Genérico', sku: 'HER-FUE-MB102',
    precio: 1500, stock: 50, condicion: 'nuevo',
    descripcion: 'Entrega 3.3V y 5V directamente a los rieles de la protoboard.',
    especificaciones: [spec('Salidas', '3.3V / 5V'), spec('Entrada', '6.5V - 12V')]
  },

  // ---------- Soldadura ----------
  {
    nombre: 'Cautín Tipo Lápiz 60W', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-CAU-60W',
    precio: 5500, stock: 30, condicion: 'nuevo',
    descripcion: 'Cautín con temperatura ajustable de 200°C a 450°C, incluye puntas intercambiables.',
    especificaciones: [spec('Potencia', '60W'), spec('Temperatura', '200 - 450°C')]
  },
  {
    nombre: 'Estación de Soldar Hakko FX-888D', categoria: 'Soldadura', marca: 'Hakko', sku: 'HER-EST-888D',
    precio: 85000, stock: 5, condicion: 'nuevo',
    descripcion: 'Estación digital profesional con control preciso de temperatura.',
    especificaciones: [spec('Potencia', '70W'), spec('Temperatura', '50 - 480°C'), spec('Pantalla', 'Digital')]
  },
  {
    nombre: 'Cautín Inteligente Pinecil V2', categoria: 'Soldadura', marca: 'Pine64', sku: 'HER-CAU-PINE',
    precio: 22000, stock: 12, condicion: 'nuevo',
    descripcion: 'Cautín portátil alimentado por USB-C, calienta en segundos.',
    especificaciones: [spec('Potencia', 'Hasta 88W'), spec('Alimentación', 'USB-C PD')]
  },
  {
    nombre: 'Soldadura Estaño 60/40 0.8mm (100g)', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-SOL-6040',
    precio: 3500, stock: 60, condicion: 'nuevo',
    descripcion: 'Rollo de soldadura con núcleo de flux para electrónica.',
    especificaciones: [spec('Aleación', 'Sn60 / Pb40'), spec('Diámetro', '0.8mm'), spec('Peso', '100g')]
  },
  {
    nombre: 'Soldadura Libre de Plomo 0.8mm (100g)', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-SOL-LF',
    precio: 5000, stock: 40, condicion: 'nuevo',
    descripcion: 'Soldadura sin plomo SAC305 con flux, cumple con RoHS.',
    especificaciones: [spec('Aleación', 'Sn96.5 / Ag3 / Cu0.5'), spec('Diámetro', '0.8mm'), spec('Peso', '100g')]
  },
  {
    nombre: 'Pasta Flux para Soldar (50g)', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-FLUX-50',
    precio: 1800, stock: 50, condicion: 'nuevo',
    descripcion: 'Flux en pasta que mejora la adherencia de la soldadura.',
    especificaciones: [spec('Peso', '50g'), spec('Tipo', 'Sin limpieza')]
  },
  {
    nombre: 'Malla Desoldadora 2mm', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-MALLA-2',
    precio: 1200, stock: 50, condicion: 'nuevo',
    descripcion: 'Malla de cobre para retirar estaño de pads y pines.',
    especificaciones: [spec('Ancho', '2mm'), spec('Largo', '1.5m')]
  },
  {
    nombre: 'Bomba Desoldadora de Aluminio', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-BOMBA-DES',
    precio: 2000, stock: 35, condicion: 'nuevo',
    descripcion: 'Succionador de estaño de resorte.',
    especificaciones: [spec('Material', 'Aluminio')]
  },
  {
    nombre: 'Soporte Tercera Mano con Lupa', categoria: 'Soldadura', marca: 'Genérico', sku: 'HER-3MANO',
    precio: 4500, stock: 25, condicion: 'nuevo',
    descripcion: 'Soporte con pinzas de cocodrilo y lupa para sujetar piezas al soldar.',
    especificaciones: [spec('Aumento', '2.5x'), spec('Pinzas', '2')]
  },

  // ---------- Herramientas de mano ----------
  {
    nombre: 'Pinza Pelacables Automática', categoria: 'Herramientas de Mano', marca: 'Genérico', sku: 'HER-PELA',
    precio: 4000, stock: 30, condicion: 'nuevo',
    descripcion: 'Pelacables autoajustable con cortador integrado.',
    especificaciones: [spec('Calibre', '10 - 24 AWG')]
  },
  {
    nombre: 'Alicate de Corte Diagonal 5"', categoria: 'Herramientas de Mano', marca: 'Genérico', sku: 'HER-ALI-CORTE',
    precio: 2500, stock: 40, condicion: 'nuevo',
    descripcion: 'Alicate de precisión para cortar patas de componentes al ras.',
    especificaciones: [spec('Largo', '5 pulgadas')]
  },
  {
    nombre: 'Kit Destornilladores de Precisión (25 en 1)', categoria: 'Herramientas de Mano', marca: 'Genérico', sku: 'HER-DEST-25',
    precio: 6000, stock: 25, condicion: 'nuevo',
    descripcion: 'Mango magnético con puntas Phillips, planas, Torx y hexagonales.',
    especificaciones: [spec('Puntas', '24'), spec('Mango', 'Magnético')]
  },
  {
    nombre: 'Kit Pinzas Antiestáticas (6 piezas)', categoria: 'Herramientas de Mano', marca: 'Genérico', sku: 'HER-PINZ-ESD',
    precio: 2800, stock: 30, condicion: 'nuevo',
    descripcion: 'Pinzas de punta fina ESD para manipular componentes SMD.',
    especificaciones: [spec('Piezas', '6'), spec('Material', 'Acero inoxidable ESD')]
  },
  {
    nombre: 'Pulsera Antiestática ESD', categoria: 'Herramientas de Mano', marca: 'Genérico', sku: 'HER-PULS-ESD',
    precio: 1500, stock: 40, condicion: 'nuevo',
    descripcion: 'Protege los componentes sensibles de descargas electrostáticas.',
    especificaciones: [spec('Cable', '1.8m con caimán')]
  },

  // ---------- Instrumentos de medición ----------
  {
    nombre: 'Osciloscopio Digital Hantek DSO2C10', categoria: 'Instrumentos de Medición', marca: 'Hantek', sku: 'HER-OSC-2C10',
    precio: 165000, stock: 3, condicion: 'nuevo',
    descripcion: 'Osciloscopio de 2 canales de 100MHz con pantalla a color de 7".',
    especificaciones: [spec('Ancho de banda', '100MHz'), spec('Canales', '2'), spec('Muestreo', '1 GSa/s')]
  },
  {
    nombre: 'Analizador Lógico USB 24MHz 8 Canales', categoria: 'Instrumentos de Medición', marca: 'Genérico', sku: 'HER-ANA-LOG',
    precio: 6500, stock: 20, condicion: 'nuevo',
    descripcion: 'Decodifica I2C, SPI y UART con software PulseView/Sigrok.',
    especificaciones: [spec('Canales', '8'), spec('Muestreo', '24MHz'), spec('Interfaz', 'USB')]
  },
  {
    nombre: 'Probador de Componentes LCR-T4', categoria: 'Instrumentos de Medición', marca: 'Genérico', sku: 'HER-LCR-T4',
    precio: 7500, stock: 18, condicion: 'nuevo',
    descripcion: 'Identifica transistores, diodos, resistencias, capacitores e inductores automáticamente.',
    especificaciones: [spec('Pantalla', 'LCD 128x64'), spec('Mide', 'R, C, L, transistores, diodos')]
  }
];

// ============================================
// SEED
// ============================================
async function seed() {
  await connectDB();

  try {
    if (RESET) {
      await Producto.deleteMany({ vendedor: null }); // solo productos de la tienda
      await Categoria.deleteMany({});
      console.log('🗑️  Datos previos eliminados (--reset)');
    }

    const mapaCategorias = {};
    let catNuevas = 0;

    // 1) Categorías principales (busca por nombre, crea si no existe)
    for (const c of categoriasPrincipales) {
      let doc = await Categoria.findOne({ nombre: c.nombre, padre: null });
      if (!doc) { doc = await Categoria.create({ ...c, padre: null, activa: true }); catNuevas++; }
      mapaCategorias[c.nombre] = doc._id;
    }

    // 2) Subcategorías
    for (const s of subcategorias) {
      const padreId = mapaCategorias[s.padre];
      let doc = await Categoria.findOne({ nombre: s.nombre, padre: padreId });
      if (!doc) {
        doc = await Categoria.create({ nombre: s.nombre, icono: s.icono, activa: true, padre: padreId });
        catNuevas++;
      }
      mapaCategorias[s.nombre] = doc._id;
    }
    console.log(`✅ Categorías listas (${catNuevas} nuevas)`);

    // 3) Productos (busca por SKU para no duplicar)
    let creados = 0, existentes = 0;
    for (const p of productos) {
      const catId = mapaCategorias[p.categoria];
      if (!catId) {
        console.log(`   ⚠️  Categoría no encontrada para "${p.nombre}": ${p.categoria} (omitido)`);
        continue;
      }
      const ya = await Producto.findOne({ sku: p.sku.toUpperCase() });
      if (ya) { existentes++; continue; }
      await Producto.create({ ...p, categoria: catId, vendedor: null, activo: true });
      creados++;
    }
    console.log(`✅ ${creados} productos creados, ${existentes} ya existían`);
    console.log(`📦 Total en el seed: ${productos.length} productos`);

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
