const { pool } = require('../config/database');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

exports.obtenerPerfil = async (req, res) => {
    try {
        const usuario = await Usuario.buscarPorId(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            mensaje: 'Perfil obtenido exitosamente',
            usuario: usuario
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar perfil del usuario logueado
exports.actualizarPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const {
            nombre,
            apellidos,
            email,
            telefono,
            direccion,
            currentPassword,
            newPassword
        } = req.body;

        console.log(`✏️ [CONTROLADOR] Actualizando perfil usuario ID: ${usuarioId}`, req.body);

        // Obtener usuario actual
        const usuario = await Usuario.buscarPorId(usuarioId);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar si el email ya existe (si se está cambiando)
        if (email && email !== usuario.email) {
            const emailExiste = await Usuario.buscarPorEmail(email);
            if (emailExiste) {
                return res.status(400).json({ error: 'El email ya está en uso' });
            }
        }

        // Preparar datos para actualizar
        const datosActualizados = {};

        // Agregar campos básicos
        if (nombre !== undefined) datosActualizados.nombre = nombre;
        if (apellidos !== undefined) datosActualizados.apellidos = apellidos;
        if (email !== undefined) datosActualizados.email = email;
        if (telefono !== undefined) datosActualizados.telefono = telefono;
        if (direccion !== undefined) datosActualizados.direccion = direccion;

        // Si se quiere cambiar la contraseña
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({
                    error: 'Debes proporcionar tu contraseña actual para cambiarla'
                });
            }

            // Verificar contraseña actual
            const [usuarioCompleto] = await pool.execute(
                'SELECT * FROM usuario WHERE id = ?',
                [usuarioId]
            );

            const passwordValido = await bcrypt.compare(currentPassword, usuarioCompleto[0].password);
            if (!passwordValido) {
                return res.status(400).json({
                    error: 'La contraseña actual es incorrecta'
                });
            }

            // Encriptar nueva contraseña y agregar a datosActualizados
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            datosActualizados.password = hashedPassword;

            console.log('🔑 [CONTROLADOR] Contraseña añadida a datosActualizados');
        }

        // Usar el método actualizar del modelo (que ahora incluye password)
        const actualizado = await Usuario.actualizar(usuarioId, datosActualizados);

        if (!actualizado) {
            return res.status(400).json({ error: 'No se pudo actualizar el perfil' });
        }

        // Obtener el usuario actualizado (sin password)
        const usuarioActualizado = await Usuario.buscarPorId(usuarioId);

        console.log(`✅ [CONTROLADOR] Perfil actualizado exitosamente usando Usuario.actualizar()`);

        res.json({
            mensaje: 'Perfil actualizado exitosamente',
            usuario: usuarioActualizado
        });

    } catch (error) {
        console.error('❌ [CONTROLADOR] Error actualizando perfil:', error);
        res.status(500).json({
            error: 'Error al actualizar el perfil',
            detalle: error.message
        });
    }
};

// Obtener todos los usuarios (solo admin)
exports.obtenerUsuarios = async (req, res) => {
    try {
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        const usuarios = await Usuario.listarTodos();

        res.json({
            total: usuarios.length,
            usuarios
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener solo clientes (solo admin)
exports.obtenerClientes = async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        console.log('🔍 [CONTROLADOR] Obteniendo lista de clientes...');

        // Obtener solo usuarios con rol 'cliente'
        const [rows] = await pool.execute(
            `SELECT 
        id, 
        email, 
        nombre, 
        apellidos, 
        telefono, 
        direccion, 
        rol, 
        fecha_creacion AS fecha_registro  
      FROM usuario 
      WHERE rol = 'cliente' AND activo = true
      ORDER BY fecha_creacion DESC`
        );

        console.log(`✅ [CONTROLADOR] Encontrados ${rows.length} clientes`);

        res.json({
            total: rows.length,
            clientes: rows
        });
    } catch (error) {
        console.error('❌ [CONTROLADOR] Error obteniendo clientes:', error);
        res.status(500).json({
            error: 'Error al obtener la lista de clientes',
            detalle: error.message
        });
    }
};

// Obtener usuario por ID
exports.obtenerUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        // Si no es admin y quiere ver otro perfil, denegar
        if (req.usuario.id !== parseInt(id) && req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                error: 'No tienes permisos para ver este perfil'
            });
        }

        const usuario = await Usuario.buscarPorId(id);

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.obtenerHistorialClienteAdmin = async (req, res) => {
    try {
        // Verificar que sea administrador
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({ error: 'No tienes permisos para esta acción' });
        }

        const { id } = req.params;
        console.log(`🔍 [ADMIN] Obteniendo historial completo del cliente ID: ${id}`);

        // Primero, obtener los datos del cliente
        const [clienteRows] = await pool.execute(
            'SELECT id, nombre, apellidos, email, telefono FROM usuario WHERE id = ?',
            [id]
        );

        if (clienteRows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const cliente = clienteRows[0];

        // Obtener todas las reservas del cliente, con información del servicio y trabajador
        const [reservas] = await pool.execute(`
      SELECT 
          r.id,
          r.fecha_reserva,
          r.hora_inicio,
          r.duracion,
          r.estado,
          r.notas,
          r.fecha_creacion,
          s.nombre as servicio_nombre,
          s.descripcion as servicio_descripcion,
          s.categoria as servicio_categoria,
          s.precio as servicio_precio,
          t.id as trabajador_id,
          u_trabajador.nombre as trabajador_nombre,
          u_trabajador.apellidos as trabajador_apellidos
      FROM reserva r
      JOIN servicio s ON r.servicio_id = s.id
      LEFT JOIN trabajador t ON r.trabajador_id = t.id
      LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
      WHERE r.cliente_id = ?
      ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
    `, [id]);

        console.log(`✅ [ADMIN] Encontradas ${reservas.length} reservas para el cliente ${id}`);

        // Calcular estadísticas
        const totalReservas = reservas.length;
        const reservasConfirmadas = reservas.filter(r => r.estado === 'confirmada').length;
        const reservasCanceladas = reservas.filter(r => r.estado === 'cancelada').length;
        const totalIngresos = reservas
            .filter(r => r.estado === 'confirmada')
            .reduce((total, r) => {
                const precio = Number(r.servicio_precio) || 0;
                return total + precio;
            }, 0);

        // Formatear la respuesta
        const historialFormateado = reservas.map(reserva => ({
            id: reserva.id,
            fecha: reserva.fecha_reserva,
            horaInicio: reserva.hora_inicio,
            duracion: reserva.duracion,
            estado: reserva.estado,
            notas: reserva.notas,
            precio: Number(reserva.servicio_precio) || 0,
            fechaCreacion: reserva.fecha_creacion,
            servicio: {
                nombre: reserva.servicio_nombre,
                descripcion: reserva.servicio_descripcion,
                categoria: reserva.servicio_categoria
            },
            trabajador: reserva.trabajador_id ? {
                id: reserva.trabajador_id,
                nombre: reserva.trabajador_nombre,
                apellidos: reserva.trabajador_apellidos
            } : null
        }));

        res.json({
            cliente: {
                id: cliente.id,
                nombre: cliente.nombre,
                apellidos: cliente.apellidos,
                email: cliente.email,
                telefono: cliente.telefono
            },
            estadisticas: {
                totalReservas,
                reservasConfirmadas,
                reservasCanceladas,
                totalIngresos: parseFloat(totalIngresos.toFixed(2)),
                promedioIngreso: reservasConfirmadas > 0 ? parseFloat((totalIngresos / reservasConfirmadas).toFixed(2)) : 0
            },
            total: historialFormateado.length,
            historial: historialFormateado
        });

    } catch (error) {
        console.error('❌ [CONTROLADOR] Error obteniendo historial de cliente:', error);
        res.status(500).json({
            error: 'Error al obtener el historial del cliente',
            detalle: error.message
        });
    }
};