const db = require('../config/database');

class Configuracion {
    static async getConfiguracion() {
        try {
            const [rows] = await db.pool.execute('SELECT * FROM configuracion_negocio WHERE id = 1');

            if (!rows[0]) {
                const configPorDefecto = {
                    nombre_negocio: 'Peluquería Selene',
                    horario_apertura: '09:00:00',
                    horario_cierre: '20:00:00',
                    dias_apertura: JSON.stringify(['martes', 'miercoles', 'jueves', 'viernes', 'sabado']),
                    tiempo_minimo_entre_reservas: 15,
                    maximo_reservas_por_dia: 50,
                    politica_cancelacion_default: 'moderada'
                };

                await db.pool.execute(
                    'INSERT INTO configuracion_negocio SET ?',
                    [configPorDefecto]
                );

                const [newRows] = await db.pool.execute('SELECT * FROM configuracion_negocio WHERE id = 1');
                return newRows[0] || null;
            }

            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async getCategoriasEspecialidades() {
        try {
            const [rows] = await db.pool.execute('SELECT categorias_especialidades FROM configuracion_negocio WHERE id = 1');

            if (!rows[0] || !rows[0].categorias_especialidades) {
                const categoriasEspecialidades = {
                    'Peluquería': [
                        'Cortes de cabello',
                        'Coloración',
                        'Mechas',
                        'Tratamientos capilares',
                        'Peinados'
                    ],
                    'Estética': [
                        'Maquillaje',
                        'Depilación',
                        'Cuidado facial',
                        'Uñas',
                        'Masajes relajantes',
                        'Masajes terapéuticos'
                    ],
                    'Prueba': [
                        'pruebaEsp1',
                        'pruebaEsp2'
                    ]
                };

                await db.pool.execute(
                    'UPDATE configuracion_negocio SET categorias_especialidades = ? WHERE id = 1',
                    [JSON.stringify(categoriasEspecialidades)]
                );

                return categoriasEspecialidades;
            }

            if (typeof rows[0].categorias_especialidades === 'string') {
                return JSON.parse(rows[0].categorias_especialidades);
            }

            return rows[0].categorias_especialidades;
        } catch (error) {
            const categoriasEspecialidades = {
                'Peluquería': [
                    'Cortes de cabello',
                    'Coloración',
                    'Mechas',
                    'Tratamientos capilares',
                    'Peinados'
                ],
                'Estética': [
                    'Maquillaje',
                    'Depilación',
                    'Cuidado facial',
                    'Uñas',
                    'Masajes relajantes',
                    'Masajes terapéuticos'
                ],
                'Prueba': [
                    'pruebaEsp1',
                    'pruebaEsp2'
                ]
            };
            return categoriasEspecialidades;
        }
    }

    static async updateConfiguracion(configData) {
        try {
            const {
                nombre_negocio,
                horario_apertura,
                horario_cierre,
                dias_apertura,
                tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia,
                politica_cancelacion_default
            } = configData;

            let diasAperturaJSON = dias_apertura;
            if (Array.isArray(dias_apertura)) {
                diasAperturaJSON = JSON.stringify(dias_apertura);
            }

            const query = `
                UPDATE configuracion_negocio 
                SET nombre_negocio = ?, horario_apertura = ?, horario_cierre = ?, 
                    dias_apertura = ?, tiempo_minimo_entre_reservas = ?, 
                    maximo_reservas_por_dia = ?, politica_cancelacion_default = ?
                WHERE id = 1
            `;

            const [result] = await db.pool.execute(query, [
                nombre_negocio,
                horario_apertura,
                horario_cierre,
                diasAperturaJSON,
                tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia,
                politica_cancelacion_default
            ]);

            return result;
        } catch (error) {
            console.error('❌ Error en updateConfiguracion:', error);
            throw error;
        }
    }

    static async updateCategoriasEspecialidades(categoriasEspecialidades) {
        try {
            const query = `
                UPDATE configuracion_negocio 
                SET categorias_especialidades = ?
                WHERE id = 1
            `;

            const [result] = await db.pool.execute(query, [
                JSON.stringify(categoriasEspecialidades)
            ]);

            return result;
        } catch (error) {
            console.error('❌ Error en updateCategoriasEspecialidades:', error);
            throw error;
        }
    }

    static async getFestivos() {
        try {
            const [rows] = await db.pool.execute('SELECT * FROM festivos ORDER BY fecha');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    static async addFestivo(festivoData) {
        try {
            const { fecha, motivo, recurrente = false } = festivoData;

            const query = 'INSERT INTO festivos (fecha, motivo, recurrente) VALUES (?, ?, ?)';
            const [result] = await db.pool.execute(query, [fecha, motivo, recurrente]);

            return result;
        } catch (error) {
            throw error;
        }
    }

    static async deleteFestivo(id) {
        try {
            const [result] = await db.pool.execute('DELETE FROM festivos WHERE id = ?', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    static async esFestivo(fecha) {
        try {
            const [rows] = await db.pool.execute(
                'SELECT * FROM festivos WHERE fecha = ?',
                [fecha]
            );
            return rows.length > 0;
        } catch (error) {
            throw error;
        }
    }

    static async getConfiguracionParaCalendario() {
        try {
            const config = await this.getConfiguracion();
            if (!config) return null;

            if (config.dias_apertura && typeof config.dias_apertura === 'string') {
                config.dias_apertura = JSON.parse(config.dias_apertura);
            }

            return config;
        } catch (error) {
            console.error('Error obteniendo configuración para calendario:', error);
            return null;
        }
    }
}

module.exports = Configuracion;