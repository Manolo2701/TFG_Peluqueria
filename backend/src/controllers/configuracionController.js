const Configuracion = require('../models/Configuracion');

const configuracionController = {
    getConfiguracionPublica: async (req, res) => {
        try {
            const configuracion = await Configuracion.getConfiguracion();

            if (!configuracion) {
                return res.status(404).json({
                    success: false,
                    message: 'Configuración no encontrada'
                });
            }

            let diasApertura = [];
            if (configuracion.dias_apertura) {
                if (typeof configuracion.dias_apertura === 'string') {
                    try {
                        diasApertura = JSON.parse(configuracion.dias_apertura);
                    } catch (error) {
                        diasApertura = [];
                    }
                } else if (Array.isArray(configuracion.dias_apertura)) {
                    diasApertura = configuracion.dias_apertura;
                }
            }

            const configPublica = {
                nombre_negocio: configuracion.nombre_negocio,
                horario_apertura: configuracion.horario_apertura,
                horario_cierre: configuracion.horario_cierre,
                dias_apertura: diasApertura
            };

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

    getConfiguracion: async (req, res) => {
        try {
            const configuracion = await Configuracion.getConfiguracion();

            if (!configuracion) {
                return res.status(404).json({
                    success: false,
                    message: 'Configuración no encontrada'
                });
            }

            let diasApertura = [];
            if (configuracion.dias_apertura) {
                if (typeof configuracion.dias_apertura === 'string') {
                    try {
                        diasApertura = JSON.parse(configuracion.dias_apertura);
                    } catch (error) {
                        diasApertura = [];
                    }
                } else if (Array.isArray(configuracion.dias_apertura)) {
                    diasApertura = configuracion.dias_apertura;
                }
            }

            const configCompleta = {
                nombre_negocio: configuracion.nombre_negocio,
                horario_apertura: configuracion.horario_apertura,
                horario_cierre: configuracion.horario_cierre,
                dias_apertura: diasApertura,
                tiempo_minimo_entre_reservas: configuracion.tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia: configuracion.maximo_reservas_por_dia,
                politica_cancelacion_default: configuracion.politica_cancelacion_default
            };

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

    getCategoriasEspecialidades: async (req, res) => {
        try {
            const categoriasEspecialidades = await Configuracion.getCategoriasEspecialidades();
            res.json({
                success: true,
                data: categoriasEspecialidades
            });
        } catch (error) {
            console.error('[CONFIGURACION] Error obteniendo categorías y especialidades:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    },

    updateConfiguracion: async (req, res) => {
        try {
            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const configData = req.body;

            if (!configData.nombre_negocio || !configData.horario_apertura || !configData.horario_cierre) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos obligatorios: nombre_negocio, horario_apertura, horario_cierre'
                });
            }

            if (configData.dias_apertura && !Array.isArray(configData.dias_apertura)) {
                return res.status(400).json({
                    success: false,
                    message: 'dias_apertura debe ser un array'
                });
            }

            await Configuracion.updateConfiguracion(configData);

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

    updateCategoriasEspecialidades: async (req, res) => {
        try {
            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const { categoriasEspecialidades } = req.body;

            if (!categoriasEspecialidades || typeof categoriasEspecialidades !== 'object') {
                return res.status(400).json({
                    success: false,
                    message: 'Datos de categorías y especialidades inválidos'
                });
            }

            await Configuracion.updateCategoriasEspecialidades(categoriasEspecialidades);

            res.json({
                success: true,
                message: 'Categorías y especialidades actualizadas correctamente'
            });
        } catch (error) {
            console.error('❌ Error actualizando categorías y especialidades:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar categorías y especialidades: ' + error.message
            });
        }
    },

    getFestivos: async (req, res) => {
        try {
            const festivos = await Configuracion.getFestivos();

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

    addFestivo: async (req, res) => {
        try {
            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const { fecha, motivo, recurrente } = req.body;

            if (!fecha || !motivo) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha y motivo son obligatorios'
                });
            }

            await Configuracion.addFestivo({ fecha, motivo, recurrente });

            res.status(201).json({
                success: true,
                message: 'Festivo agregado correctamente'
            });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
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

    deleteFestivo: async (req, res) => {
        try {
            if (!req.usuario || req.usuario.rol !== 'administrador') {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para realizar esta acción'
                });
            }

            const { id } = req.params;

            await Configuracion.deleteFestivo(id);

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