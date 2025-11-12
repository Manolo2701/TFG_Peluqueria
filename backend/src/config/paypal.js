// Configuración de PayPal - Modo Simulación
// No requiere SDK de PayPal instalado

console.log(' Configuración PayPal cargada (Modo Simulación)');

const paypalConfig = {
  mode: 'simulation',
  sandbox: true,
  clientId: 'AZOlg9pobEzlBxIsPb32Di98pseD9vXnVo5kBziuDs8HsGZ7M8oh_7eFyju7gvOVAZFO8Wfn3q02_Abu',
  clientSecret: 'EAFnkgCUesyBAlpIEjv0m2DsUtY9-9FELhfNFnVvtmf6wgQ5srmLQX3pGs10WHUzldj9cMxcueeEIIWI'
};

module.exports = paypalConfig;
