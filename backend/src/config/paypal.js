// Configuración de pagos para el proyecto académico.
// La integración se mantiene en modo simulación; no se realizan cobros reales.
// Si se conecta un entorno sandbox en el futuro, las credenciales deben
// configurarse mediante variables de entorno y nunca guardarse en Git.

const paypalConfig = {
  mode: process.env.PAYPAL_MODE || 'simulation',
  sandbox: true,
  clientId: process.env.PAYPAL_CLIENT_ID || '',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || ''
};

module.exports = paypalConfig;
