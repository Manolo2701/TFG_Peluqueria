const Configuracion = require('../models/Configuracion');

const configuracionController = {
    // Obtener configuración pública limitada (sin autenticación)
    getConfiguracionPublica: async (req, res) => {
        try {
            console.log('[CONFIGURACION] Obteniendo configuración pública limitada...');
            const configuracion = await Configuracion.getConfiguracion();

            if (!configuracion) {
                return res.status(404).json({
                    success: false,
                    message: 'Configuración no encontrada'
                });
            }

            // Parsear días de apertura
            let diasApertura = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            if (configuracion.dias_apertura && typeof configuracion.dias_apertura === 'string') {
                try {
                    diasApertura = JSON.parse(configuracion.dias_apertura);
                } catch (error) {
                    console.error('[CONFIGURACION] Error parseando dias_apertura:', error);
                }
            }

            // Devolver SOLO datos realmente públicos
            const configPublica = {
                nombre_negocio: configuracion.nombre_negocio,
                horario_apertura: configuracion.horario_apertura,
                horario_cierre: configuracion.horario_cierre,
                dias_apertura: diasApertura
                // NO incluir: tiempo_minimo_entre_reservas, maximo_reservas_por_dia, politica_cancelacion_default
            };

            console.log('[CONFIGURACION] Configuración pública limitada enviada');
            res.json({
                success: true,
                data: configPublica
            });
        } catch (error) {
            console.error('[CONFIGURACION] Error obteniendo configuración pública:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },


    // 🔥 AGREGAR ESTE MÉTODO FALTANTE - Obtener configuración completa (con autenticación)
    getConfiguracion: async (req, res) => {
        try {
            console.log('[CONFIGURACION] Obteniendo configuración completa...');
            const configuracion = await Configuracion.getConfiguracion();

            if (!configuracion) {
                return res.status(404).json({
                    success: false,
                    message: 'Configuración no encontrada'
                });
            }

            // Parsear días de apertura
            let diasApertura = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            if (configuracion.dias_apertura && typeof configuracion.dias_apertura === 'string') {
                try {
                    diasApertura = JSON.parse(configuracion.dias_apertura);
                } catch (error) {
                    console.error('[CONFIGURACION] Error parseando dias_apertura:', error);
                }
            }

            // Devolver TODOS los datos (para usuarios autenticados)
            const configCompleta = {
                nombre_negocio: configuracion.nombre_negocio,
                horario_apertura: configuracion.horario_apertura,
                horario_cierre: configuracion.horario_cierre,
                dias_apertura: diasApertura,
                tiempo_minimo_entre_reservas: configuracion.tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia: configuracion.maximo_reservas_por_dia,
                politica_cancelacion_default: configuracion.politica_cancelacion_default
            };

            console.log('[CONFIGURACION] Configuración completa enviada');
            res.json({
                success: true,
                data: configCompleta
            });
        } catch (error) {
            console.error('[CONFIGURACION] Error obteniendo configuración completa:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    // Actualizar configuración (solo administrador) - CORREGIDO
    updateConfiguracion: async (req, res) => {
        try {
            console.log('🔧 Actualizando configuración...');

            // Verificar que es administrador
            if (!req.usuario || req.usuario.rol !== 'administrador') {
                console.log('❌ Usuario no autorizado. req.usuario:', req.usuario);
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const configData = req.body;
            console.log('Datos recibidos para actualizar:', configData);

            // Validaciones básicas
            if (!configData.nombre_negocio || !configData.horario_apertura || !configData.horario_cierre) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: nombre_negocio, horario_apertura, horario_cierre'
                });
            }

            // Asegurar que dias_apertura sea un array
            if (configData.dias_apertura && !Array.isArray(configData.dias_apertura)) {
                return res.status(400).json({
                    success: false,
                    message: 'dias_apertura debe ser un array'
                });
            }

            await Configuracion.updateConfiguracion(configData);

            console.log('✅ Configuración actualizada correctamente');
            res.json({
                success: true,
                message: 'Configuración actualizada correctamente'
            });
        } catch (error) {
            console.error('❌ Error actualizando configuración:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar configuración: ' + error.message
            });
        }
    },

    // Obtener festivos
    getFestivos: async (req, res) => {
        try {
            console.log('🔧 Obteniendo festivos...');
            const festivos = await Configuracion.getFestivos();

            console.log(`✅ Festivos obtenidos: ${festivos.length}`);
            res.json({
                success: true,
                data: festivos
            });
        } catch (error) {
            console.error('❌ Error obteniendo festivos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener festivos'
            });
        }
    },

    // Agregar festivo (solo administrador) - CORREGIDO
    addFestivo: async (req, res) => {
        try {
            console.log('🔧 Agregando festivo...');

            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const { fecha, motivo, recurrente } = req.body;
            console.log('Datos del festivo:', { fecha, motivo, recurrente });

            if (!fecha || !motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha y motivo son obligatorios'
                });
            }

            await Configuracion.addFestivo({ fecha, motivo, recurrente });

            console.log('✅ Festivo agregado correctamente');
            res.status(201).json({
                success: true,
                message: 'Festivo agregado correctamente'
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                console.log('⚠️  Festivo duplicado:', error.message);
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un festivo para esta fecha'
                });
            }

            console.error('❌ Error agregando festivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al agregar festivo'
            });
        }
    },

    // Eliminar festivo (solo administrador) - CORREGIDO
    deleteFestivo: async (req, res) => {
        try {
            console.log('🔧 Eliminando festivo...');

            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const { id } = req.params;
            console.log('ID del festivo a eliminar:', id);

            await Configuracion.deleteFestivo(id);

            console.log('✅ Festivo eliminado correctamente');
            res.json({
                success: true,
                message: 'Festivo eliminado correctamente'
            });
        } catch (error) {
            console.error('❌ Error eliminando festivo:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al eliminar festivo'
            });
        }
    }
};

module.exports = configuracionController;