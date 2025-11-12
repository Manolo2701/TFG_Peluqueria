// backend/generateHash.js
const bcrypt = require('bcrypt');

// Generar hash para "pelu123"
const password = 'pelu123';
const hash = bcrypt.hashSync(password, 10);
console.log('Hash para "pelu123":', hash);

// También puedes probar verificar
const testPassword = 'pelu123';
const isValid = bcrypt.compareSync(testPassword, hash);
console.log('¿La contraseña es válida?:', isValid);