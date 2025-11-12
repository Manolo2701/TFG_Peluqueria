const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function resetUsers() {
    try {
        console.log(' Iniciando reset de usuarios...');
        
        // 1. Eliminar todos los usuarios existentes
        await pool.execute('DELETE FROM usuario');
        console.log(' Todos los usuarios eliminados');
        
        // 2. Crear nuevo administrador
        const adminPassword = await bcrypt.hash('admin123', 10);
        await pool.execute(
            'INSERT INTO usuario (email, password, nombre, apellidos, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['admin@selene.com', adminPassword, 'María', 'García López', '600111222', 'administrador', 1]
        );
        console.log(' Administrador creado: admin@selene.com / admin123');
        
        // 3. Crear nuevo trabajador
        const workerPassword = await bcrypt.hash('trabajador123', 10);
        await pool.execute(
            'INSERT INTO usuario (email, password, nombre, apellidos, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['trabajador@selene.com', workerPassword, 'Carlos', 'Martínez Ruiz', '600333444', 'trabajador', 1]
        );
        console.log(' Trabajador creado: trabajador@selene.com / trabajador123');
        
        // 4. Crear nuevo cliente
        const clientPassword = await bcrypt.hash('cliente123', 10);
        await pool.execute(
            'INSERT INTO usuario (email, password, nombre, apellidos, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['cliente@selene.com', clientPassword, 'Ana', 'Gómez Sánchez', '600555666', 'cliente', 1]
        );
        console.log(' Cliente creado: cliente@selene.com / cliente123');
        
        // 5. También crear el usuario test por si acaso
        const testPassword = await bcrypt.hash('password', 10);
        await pool.execute(
            'INSERT INTO usuario (email, password, nombre, apellidos, telefono, rol, activo) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['test@test.com', testPassword, 'Usuario', 'Prueba', '123456789', 'cliente', 1]
        );
        console.log(' Usuario test creado: test@test.com / password');
        
        console.log(' Reset de usuarios completado!');
        console.log('');
        console.log(' CREDENCIALES NUEVAS:');
        console.log('    Admin: admin@selene.com / admin123');
        console.log('     Trabajador: trabajador@selene.com / trabajador123');
        console.log('    Cliente: cliente@selene.com / cliente123');
        console.log('    Test: test@test.com / password');
        
        process.exit(0);
    } catch (error) {
        console.error(' Error durante el reset:', error);
        process.exit(1);
    }
}

resetUsers();
