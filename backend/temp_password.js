const bcrypt = require('bcryptjs');

async function generatePassword() {
    const password = 'password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Contraseña encriptada:', hash);
}

generatePassword();
