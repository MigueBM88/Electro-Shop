const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede exceder 100 caracteres']
    },
    correo: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un correo electrónico válido'
      ]
    },
    contrasena: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false
    },
    telefono: {
      type: String,
      trim: true,
      match: [/^[0-9]{8}$/, 'El teléfono debe tener 8 dígitos']
    },
    direccion: {
      provincia: { type: String, trim: true },
      canton: { type: String, trim: true },
      distrito: { type: String, trim: true },
      detalle: { type: String, trim: true }
    },
    rol: {
      type: String,
      enum: {
        values: ['cliente', 'admin', 'vendedor'],
        message: 'El rol {VALUE} no es válido'
      },
      default: 'cliente'
    },
    activo: {
      type: Boolean,
      default: true
    },
    correoConfirmado: {
      type: Boolean,
      default: false
    },
    tokenConfirmacion: {
      type: String,
      select: false
    },
    intentosFallidos: {
      type: Number,
      default: 0
    },
    bloqueadoHasta: {
      type: Date,
      default: null
    },
    fechaRegistro: {
      type: Date,
      default: Date.now
    },
    ultimoAcceso: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Hashear contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('contrasena')) return next();
  const salt = await bcrypt.genSalt(12);
  this.contrasena = await bcrypt.hash(this.contrasena, salt);
  next();
});

// Comparar contraseña
userSchema.methods.compararContrasena = async function (contrasenaIngresada) {
  return await bcrypt.compare(contrasenaIngresada, this.contrasena);
};

// Verificar si la cuenta está bloqueada
userSchema.methods.estaBloqueada = function () {
  if (this.bloqueadoHasta && this.bloqueadoHasta > Date.now()) {
    return true;
  }
  return false;
};

// Tiempo restante de bloqueo en minutos
userSchema.methods.tiempoRestanteBloqueo = function () {
  if (!this.bloqueadoHasta) return 0;
  const restante = this.bloqueadoHasta - Date.now();
  return Math.ceil(restante / (1000 * 60));
};

// Registrar intento fallido y bloquear si excede el máximo
userSchema.methods.registrarIntentoFallido = async function () {
  const maxIntentos = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
  const tiempoBloqueo = parseInt(process.env.LOCK_TIME_MINUTES) || 30;

  if (this.bloqueadoHasta && this.bloqueadoHasta <= Date.now()) {
    this.intentosFallidos = 0;
    this.bloqueadoHasta = null;
  }

  this.intentosFallidos += 1;

  if (this.intentosFallidos >= maxIntentos) {
    this.bloqueadoHasta = new Date(Date.now() + tiempoBloqueo * 60 * 1000);
  }

  await this.save();
};

// Resetear intentos tras login exitoso
userSchema.methods.resetearIntentosFallidos = async function () {
  this.intentosFallidos = 0;
  this.bloqueadoHasta = null;
  this.ultimoAcceso = Date.now();
  await this.save();
};

userSchema.index({ correo: 1 }, { unique: true });
userSchema.index({ rol: 1 });
userSchema.index({ activo: 1 });

module.exports = mongoose.model('User', userSchema);
