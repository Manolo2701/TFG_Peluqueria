const { pool } = require('../config/database');

class Reserva {
    // Crear nueva reserva
    static async crear(reservaData) {
        try {
            // ✅ VALIDACIÓN MEJORADA
            if (!reservaData.cliente_id || !reservaData.servicio_id || !reservaData.fecha_reserva || !reservaData.hora_inicio) {
                throw new Error('Datos incompletos para crear reserva');
            }

            const datosLimpios = {
                cliente_id: reservaData.cliente_id,
                servicio_id: reservaData.servicio_id,
                trabajador_id: reservaData.trabajador_id || null, // Puede ser null inicialmente
                fecha_reserva: reservaData.fecha_reserva,
                hora_inicio: reservaData.hora_inicio,
                duracion: reservaData.duracion || 60, // Valor por defecto
                estado: reservaData.estado || 'pendiente', // Por defecto pendiente
                notas: reservaData.notas || null
            };

            console.log('📅 Creando reserva con datos:', datosLimpios);

            const [result] = await pool.execute(
                `INSERT INTO reserva (cliente_id, servicio_id, trabajador_id, fecha_reserva, hora_inicio, duracion, estado, notas)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [datosLimpios.cliente_id, datosLimpios.servicio_id, datosLimpios.trabajador_id,
                datosLimpios.fecha_reserva, datosLimpios.hora_inicio, datosLimpios.duracion,
                datosLimpios.estado, datosLimpios.notas]
            );

            console.log('✅ Reserva insertada con ID:', result.insertId);
            return result.insertId;
        } catch (error) {
            console.error('❌ Error en Reserva.crear:', error.message);
            throw error;
        }
    }

    // Obtener todas las reservas
    static async listarTodas() {
        try {
            const [rows] = await pool.execute(`
            SELECT 
                r.*, 
                u_cliente.nombre as cliente_nombre, 
                u_cliente.apellidos as cliente_apellidos,
                s.nombre as servicio_nombre, 
                s.duracion, 
                s.precio,
                u_trabajador.nombre as trabajador_nombre,
                u_trabajador.apellidos as trabajador_apellidos
            FROM reserva r
            JOIN usuario u_cliente ON r.cliente_id = u_cliente.id
            JOIN servicio s ON r.servicio_id = s.id
            LEFT JOIN trabajador t ON r.trabajador_id = t.id
            LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
            ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
        `);
            return rows;
        } catch (error) {
            console.error('Error listando reservas:', error);
            throw error;
        }
    }

    // Obtener reservas por cliente
    static async buscarPorCliente(clienteId) {
        try {
            const [rows] = await pool.execute(`
            SELECT 
                r.*, 
                s.nombre as servicio_nombre, 
                s.duracion, 
                s.precio,
                u_trabajador.nombre as trabajador_nombre,
                u_trabajador.apellidos as trabajador_apellidos
            FROM reserva r
            JOIN servicio s ON r.servicio_id = s.id
            LEFT JOIN trabajador t ON r.trabajador_id = t.id
            LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
            WHERE r.cliente_id = ?
            ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
        `, [clienteId]);
            return rows;
        } catch (error) {
            console.error('Error buscando reservas por cliente:', error);
            throw error;
        }
    }

    // Obtener reserva por ID
    static async buscarPorId(id) {
        try {
            const [rows] = await pool.execute(`
      SELECT 
        r.*, 
        u_cliente.nombre as cliente_nombre, 
        u_cliente.apellidos as cliente_apellidos,
        u_cliente.telefono as cliente_telefono,
        s.nombre as servicio_nombre, 
        s.duracion, 
        s.precio, 
        s.descripcion as servicio_descripcion,
        s.categoria as servicio_categoria,
        u_trabajador.nombre as trabajador_nombre,
        u_trabajador.apellidos as trabajador_apellidos,
        u_trabajador.email as trabajador_email
      FROM reserva r
      JOIN usuario u_cliente ON r.cliente_id = u_cliente.id
      JOIN servicio s ON r.servicio_id = s.id
      LEFT JOIN trabajador t ON r.trabajador_id = t.id
      LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
      WHERE r.id = ?
    `, [id]);
            return rows[0];
        } catch (error) {
            console.error('Error buscando reserva por ID:', error);
            throw error;
        }
    }

    // Verificar disponibilidad
    static async verificarDisponibilidad(trabajador_id, fecha_reserva, hora_inicio, duracion) {
        try {
            console.log(`🔍 Verificando disponibilidad: trabajador ${trabajador_id}, ${fecha_reserva} ${hora_inicio}, ${duracion}min`);

            const [rows] = await pool.execute(`
                SELECT id, hora_inicio, duracion, estado 
                FROM reserva 
                WHERE trabajador_id = ? 
                AND fecha_reserva = ? 
                AND estado IN ('pendiente', 'confirmada')
                AND (
                    (hora_inicio <= ? AND DATE_ADD(hora_inicio, INTERVAL duracion MINUTE) > ?) OR
                    (hora_inicio < DATE_ADD(?, INTERVAL ? MINUTE) AND DATE_ADD(hora_inicio, INTERVAL duracion MINUTE) >= ?) OR
                    (hora_inicio >= ? AND hora_inicio < DATE_ADD(?, INTERVAL ? MINUTE))
                )
            `, [
                trabajador_id, fecha_reserva,
                hora_inicio, hora_inicio,
                hora_inicio, duracion, hora_inicio,
                hora_inicio, hora_inicio, duracion
            ]);

            console.log(`📊 Encontrados ${rows.length} conflictos de horario:`);
            rows.forEach(conflicto => {
                console.log(`   - Reserva ${conflicto.id}: ${conflicto.hora_inicio} (${conflicto.duracion}min), estado: ${conflicto.estado}`);
            });

            return rows.length === 0; // true si está disponible
        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            throw error;
        }
    }

    // Obtener reservas por trabajador y fecha
    // En models/Reserva.js - REEMPLAZAR el método buscarPorTrabajador
    static async buscarPorTrabajador(trabajadorId) {
        try {
            console.log(`🔍 [MODELO] Buscando reservas EXCLUSIVAS para trabajador_id: ${trabajadorId}`);

            const [rows] = await pool.execute(`
            SELECT 
                r.*, 
                s.nombre as servicio_nombre, 
                s.categoria,
                s.duracion as servicio_duracion,
                s.precio as servicio_precio,
                u.nombre as cliente_nombre, 
                u.apellidos as cliente_apellidos, 
                u.telefono as cliente_telefono,
                u_trabajador.nombre as trabajador_nombre,
                u_trabajador.apellidos as trabajador_apellidos
            FROM reserva r
            JOIN servicio s ON r.servicio_id = s.id
            JOIN usuario u ON r.cliente_id = u.id
            LEFT JOIN trabajador t ON r.trabajador_id = t.id
            LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
            WHERE r.trabajador_id = ? 
            AND r.estado IN ('pendiente', 'confirmada')
            ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
        `, [trabajadorId]);

            console.log(`📊 [MODELO] Encontradas ${rows.length} reservas para trabajador ${trabajadorId}`);

            if (rows.length > 0) {
                console.log(`📋 [MUESTRA] Primera reserva:`, {
                    id: rows[0].id,
                    trabajador_id: rows[0].trabajador_id,
                    cliente: `${rows[0].cliente_nombre} ${rows[0].cliente_apellidos}`,
                    servicio: rows[0].servicio_nombre
                });
            }

            return rows;
        } catch (error) {
            console.error('Error buscando reservas por trabajador:', error);
            throw error;
        }
    }

    // === NUEVOS MÉTODOS PARA SISTEMA HÍBRIDO ===
    static async buscarPorTrabajador(trabajadorId) {
        try {
            console.log(`🔍 [MODELO] Buscando reservas para trabajador_id: ${trabajadorId}`);

            const [rows] = await pool.execute(`
                SELECT 
                    r.*, 
                    s.nombre as servicio_nombre, 
                    s.categoria,
                    s.duracion as servicio_duracion,
                    s.precio as servicio_precio,
                    u.nombre as cliente_nombre, 
                    u.apellidos as cliente_apellidos, 
                    u.telefono as cliente_telefono,
                    u_trabajador.nombre as trabajador_nombre,
                    u_trabajador.apellidos as trabajador_apellidos
                FROM reserva r
                JOIN servicio s ON r.servicio_id = s.id
                JOIN usuario u ON r.cliente_id = u.id
                LEFT JOIN trabajador t ON r.trabajador_id = t.id
                LEFT JOIN usuario u_trabajador ON t.usuario_id = u_trabajador.id
                WHERE r.trabajador_id = ? 
                AND r.estado IN ('pendiente', 'confirmada')
                ORDER BY r.fecha_reserva DESC, r.hora_inicio DESC
            `, [trabajadorId]);

            console.log(`📊 [MODELO] Encontradas ${rows.length} reservas para trabajador ${trabajadorId}`);
            return rows;
        } catch (error) {
            console.error('Error buscando reservas por trabajador:', error);
            throw error;
        }
    }


    static async buscarPorTrabajadorYFecha(trabajadorId, fecha) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM reserva 
                WHERE trabajador_id = ? 
                AND fecha_reserva = ? 
                AND estado IN ('pendiente', 'confirmada')
                ORDER BY hora_inicio ASC
            `, [trabajadorId, fecha]);
            return rows;
        } catch (error) {
            console.error('Error buscando reservas por trabajador y fecha:', error);
            throw error;
        }
    }

    // Verificar disponibilidad - MEJORADO
    static async verificarDisponibilidad(trabajador_id, fecha_reserva, hora_inicio, duracion) {
        try {
            console.log(`🔍 Verificando disponibilidad: trabajador ${trabajador_id}, ${fecha_reserva} ${hora_inicio}, ${duracion}min`);

            const [rows] = await pool.execute(`
                SELECT id, hora_inicio, duracion, estado 
                FROM reserva 
                WHERE trabajador_id = ? 
                AND fecha_reserva = ? 
                AND estado IN ('pendiente', 'confirmada')
                AND (
                    (hora_inicio <= ? AND DATE_ADD(hora_inicio, INTERVAL duracion MINUTE) > ?) OR
                    (hora_inicio < DATE_ADD(?, INTERVAL ? MINUTE) AND DATE_ADD(hora_inicio, INTERVAL duracion MINUTE) >= ?) OR
                    (hora_inicio >= ? AND hora_inicio < DATE_ADD(?, INTERVAL ? MINUTE))
                )
            `, [
                trabajador_id, fecha_reserva,
                hora_inicio, hora_inicio,
                hora_inicio, duracion, hora_inicio,
                hora_inicio, hora_inicio, duracion
            ]);

            console.log(`📊 Encontrados ${rows.length} conflictos de horario:`);
            rows.forEach(conflicto => {
                console.log(`   - Reserva ${conflicto.id}: ${conflicto.hora_inicio} (${conflicto.duracion}min), estado: ${conflicto.estado}`);
            });

            return rows.length === 0; // true si está disponible
        } catch (error) {
            console.error('Error verificando disponibilidad:', error);
            throw error;
        }
    }

    // Asignar trabajador a reserva
    static async asignarTrabajador(reservaId, trabajadorId) {
        try {
            const [result] = await pool.execute(
                'UPDATE reserva SET trabajador_id = ? WHERE id = ? AND trabajador_id IS NULL',
                [trabajadorId, reservaId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error asignando trabajador:', error);
            throw error;
        }
    }

    // Actualizar estado de reserva
    static async actualizarEstado(reservaId, estado) {
        try {
            console.log(`🔄 Actualizando estado de reserva ${reservaId} a: ${estado}`);
            const [result] = await pool.execute(
                'UPDATE reserva SET estado = ? WHERE id = ?',
                [estado, reservaId]
            );

            const updated = result.affectedRows > 0;
            console.log(`✅ Estado ${updated ? 'actualizado' : 'NO actualizado'} para reserva ${reservaId}`);
            return updated;
        } catch (error) {
            console.error('Error actualizando estado:', error);
            throw error;
        }
    }

    // Liberar reserva (quitar trabajador)
    static async liberarReserva(reservaId) {
        try {
            const [result] = await pool.execute(
                'UPDATE reserva SET trabajador_id = NULL, estado = "pendiente" WHERE id = ?',
                [reservaId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error liberando reserva:', error);
            throw error;
        }
    }

    static async actualizarNotasInternas(reservaId, notasInternas) {
        try {
            const [result] = await pool.execute(
                'UPDATE reserva SET notas_internas = ? WHERE id = ?',
                [notasInternas, reservaId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error actualizando notas internas:', error);
            throw error;
        }
    }

    static async obtenerTrabajadorDeReserva(reservaId) {
        try {
            const [rows] = await pool.execute(`
                SELECT t.id, u.nombre, u.apellidos 
                FROM reserva r
                JOIN trabajador t ON r.trabajador_id = t.id
                JOIN usuario u ON t.usuario_id = u.id
                WHERE r.id = ?
            `, [reservaId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error obteniendo trabajador de reserva:', error);
            throw error;
        }
    }


    // Obtener notas internas (solo para trabajadores/administradores)
    static async obtenerNotasInternas(reservaId) {
        try {
            const [rows] = await pool.execute(
                'SELECT notas_internas FROM reserva WHERE id = ?',
                [reservaId]
            );
            return rows[0] ? rows[0].notas_internas : null;
        } catch (error) {
            console.error('Error obteniendo notas internas:', error);
            throw error;
        }
    }

    // === MÉTODOS PARA POLÍTICAS DE CANCELACIÓN ===
    static async inicializarCamposCancelacion() {
        try {
            // Verificar si las columnas ya existen antes de añadirlas
            const [columns] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'reserva' 
            AND TABLE_SCHEMA = DATABASE()
            AND COLUMN_NAME IN ('politica_cancelacion', 'fecha_cancelacion', 'motivo_cancelacion', 'penalizacion_aplicada')
        `);

            const existingColumns = columns.map(col => col.COLUMN_NAME);
            const columnsToAdd = [];

            if (!existingColumns.includes('politica_cancelacion')) {
                columnsToAdd.push("ADD COLUMN politica_cancelacion ENUM('flexible', 'estricta', 'moderada') DEFAULT 'flexible'");
            }
            if (!existingColumns.includes('fecha_cancelacion')) {
                columnsToAdd.push("ADD COLUMN fecha_cancelacion DATETIME NULL");
            }
            if (!existingColumns.includes('motivo_cancelacion')) {
                columnsToAdd.push("ADD COLUMN motivo_cancelacion TEXT NULL");
            }
            if (!existingColumns.includes('penalizacion_aplicada')) {
                columnsToAdd.push("ADD COLUMN penalizacion_aplicada DECIMAL(10,2) DEFAULT 0");
            }

            if (columnsToAdd.length > 0) {
                await pool.execute(`ALTER TABLE reserva ${columnsToAdd.join(', ')}`);
                console.log('✅ Campos de cancelación añadidos:', columnsToAdd.length);
            } else {
                console.log('✅ Todos los campos de cancelación ya existen');
            }

            return true;
        } catch (error) {
            console.error('Error inicializando campos de cancelación:', error);
            return false;
        }
    }

    // Añadir método para inicializar al arrancar la app
    static async inicializarSistemaCancelacion() {
        try {
            await this.inicializarCamposCancelacion();
            console.log('✅ Sistema de cancelación inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando sistema de cancelación:', error);
            return false;
        }
    }

    // Cancelar reserva con política
    static async cancelarConPolitica(reservaId, motivo, politica = 'flexible') {
        try {
            const reserva = await this.buscarPorId(reservaId);
            if (!reserva) {
                throw new Error('Reserva no encontrada');
            }

            // Calcular penalización
            const penalizacion = await this.calcularPenalizacion(reserva, politica);

            const [result] = await pool.execute(
                `UPDATE reserva 
             SET estado = 'cancelada', 
                 politica_cancelacion = ?,
                 fecha_cancelacion = NOW(),
                 motivo_cancelacion = ?,
                 penalizacion_aplicada = ?
             WHERE id = ?`,
                [politica, motivo, penalizacion, reservaId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error cancelando reserva con política:', error);
            throw error;
        }
    }

    static async calcularPenalizacion(reserva, politica = 'flexible') {
        try {
            const ahora = new Date();
            const fechaReserva = new Date(reserva.fecha_reserva + 'T' + reserva.hora_inicio);
            const horasDiferencia = (fechaReserva - ahora) / (1000 * 60 * 60);

            let porcentajePenalizacion = 0;

            switch (politica) {
                case 'flexible':
                    porcentajePenalizacion = horasDiferencia < 24 ? 0.1 : 0;
                    break;
                case 'moderada':
                    porcentajePenalizacion = horasDiferencia < 48 ? 0.25 : 0;
                    break;
                case 'estricta':
                    porcentajePenalizacion = horasDiferencia < 72 ? 0.5 : 0;
                    break;
                default:
                    porcentajePenalizacion = 0;
            }

            // ✅ USAR EL PRECIO REAL DEL SERVICIO desde la reserva
            const precioServicio = reserva.precio || 0;
            return precioServicio * porcentajePenalizacion;

        } catch (error) {
            console.error('Error calculando penalización:', error);
            return 0;
        }
    }

    // Obtener políticas disponibles
    static obtenerPoliticasDisponibles() {
        return [
            { valor: 'flexible', nombre: 'Flexible', descripcion: 'Cancelación gratuita hasta 24 horas antes' },
            { valor: 'moderada', nombre: 'Moderada', descripcion: '25% de penalización si se cancela con menos de 48 horas' },
            { valor: 'estricta', nombre: 'Estricta', descripcion: '50% de penalización si se cancela con menos de 72 horas' }
        ];
    }
}

module.exports = Reserva;