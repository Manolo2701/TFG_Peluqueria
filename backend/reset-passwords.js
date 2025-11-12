const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function resetPasswords() {
    try {
        console.log(' Reseteando contraseñas de usuarios existentes...');
        
        // Resetear contraseña del administrador
        const adminPassword = await bcrypt.hash('admin123', 10);
        await pool.execute(
            'UPDATE usuario SET password = ? WHERE email = ?',
            [adminPassword, 'admin@selene.com']
        );
        console.log(' Contraseña de admin@selene.com actualizada: admin123');
        
        // Resetear contraseña del trabajador1
        const worker1Password = await bcrypt.hash('trabajador123', 10);
        await pool.execute(
            'UPDATE usuario SET password = ? WHERE email = ?',
            [worker1Password, 'trabajador1@selene.com']
        );
        console.log(' Contraseña de trabajador1@selene.com actualizada: trabajador123');
        
        // Resetear contraseña del trabajador2
        const worker2Password = await bcrypt.hash('trabajador123', 10);
        await pool.execute(
            'UPDATE usuario SET password = ? WHERE email = ?',
            [worker2Password, 'trabajador2@selene.com']
        );
        console.log(' Contraseña de trabajador2@selene.com actualizada: trabajador123');
        
        // Resetear contraseña de ma@gmail.com
        const clientPassword = await bcrypt.hash('cliente123', 10);
        await pool.execute(
            'UPDATE usuario SET password = ? WHERE email = ?',
            [clientPassword, 'ma@gmail.com']
        );
        console.log(' Contraseña de ma@gmail.com actualizada: cliente123');
        
        console.log(' Contraseñas reseteadas correctamente!');
        console.log('');
        console.log(' CREDENCIALES ACTUALIZADAS:');
        console.log('    Admin: admin@selene.com / admin123');
        console.log('     Trabajador1: trabajador1@selene.com / trabajador123');
        console.log('     Trabajador2: trabajador2@selene.com / trabajador123');
        console.log('    Cliente: ma@gmail.com / cliente123');
        
        process.exit(0);
    } catch (error) {
        console.error(' Error durante el reset:', error);
        process.exit(1);
    }
}

resetPasswords();
