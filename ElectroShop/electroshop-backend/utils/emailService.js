const nodemailer = require('nodemailer');

const crearTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      sendMail: async (opciones) => {
        console.log('\n📧 ========= EMAIL SIMULADO =========');
        console.log(`   Para: ${opciones.to}`);
        console.log(`   Asunto: ${opciones.subject}`);
        console.log(`   Contenido: ${opciones.text || 'Ver HTML'}`);
        console.log('📧 ==================================\n');
        return { messageId: `dev-${Date.now()}` };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const enviarCorreoConfirmacion = async (usuario, tokenConfirmacion) => {
  const transporter = crearTransporter();
  const urlConfirmacion = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirmar-correo/${tokenConfirmacion}`;

  await transporter.sendMail({
    from: `"ElectroShop" <${process.env.EMAIL_FROM}>`,
    to: usuario.correo,
    subject: '🔌 ElectroShop - Confirma tu cuenta',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">¡Bienvenido a ElectroShop!</h2>
        <p>Hola <strong>${usuario.nombre}</strong>,</p>
        <p>Gracias por registrarte. Para activar tu cuenta, haz clic en el siguiente enlace:</p>
        <a href="${urlConfirmacion}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Confirmar mi cuenta</a>
        <p style="color: #6b7280; font-size: 14px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">ElectroShop - Componentes Electrónicos Costa Rica</p>
      </div>
    `
  });
};

const enviarCorreoDesactivacion = async (usuario) => {
  const transporter = crearTransporter();

  await transporter.sendMail({
    from: `"ElectroShop" <${process.env.EMAIL_FROM}>`,
    to: usuario.correo,
    subject: '⚠️ ElectroShop - Tu cuenta ha sido desactivada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Cuenta Desactivada</h2>
        <p>Hola <strong>${usuario.nombre}</strong>,</p>
        <p>Te informamos que tu cuenta en ElectroShop ha sido desactivada por un administrador.</p>
        <p>Si crees que esto es un error, por favor contacta a nuestro equipo de soporte.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">ElectroShop - Componentes Electrónicos Costa Rica</p>
      </div>
    `
  });
};

module.exports = {
  enviarCorreoConfirmacion,
  enviarCorreoDesactivacion
};
