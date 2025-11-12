const db = require('../config/database');

class Configuracion {
    // Obtener configuración actual
    static async getConfiguracion() {
        try {
            const [rows] = await db.pool.execute('SELECT * FROM configuracion_negocio WHERE id = 1');
            return rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar configuración - VERSIÓN CORREGIDA
    static async updateConfiguracion(configData) {
        try {
            console.log('📝 Datos recibidos para actualizar configuración:', configData);

            const {
                nombre_negocio,
                horario_apertura,
                horario_cierre,
                dias_apertura,
                tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia,
                politica_cancelacion_default
            } = configData;

            // Convertir dias_apertura a JSON string si es un array
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

            console.log('🔄 Ejecutando query con parámetros:', {
                nombre_negocio,
                horario_apertura,
                horario_cierre,
                dias_apertura: diasAperturaJSON,
                tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia,
                politica_cancelacion_default
            });

            const [result] = await db.pool.execute(query, [
                nombre_negocio,
                horario_apertura,
                horario_cierre,
                diasAperturaJSON,
                tiempo_minimo_entre_reservas,
                maximo_reservas_por_dia,
                politica_cancelacion_default
            ]);

            console.log('✅ Resultado de la actualización:', result);
            return result;
        } catch (error) {
            console.error('❌ Error en updateConfiguracion:', error);
            throw error;
        }
    }

    // Obtener todos los festivos
    static async getFestivos() {
        try {
            const [rows] = await db.pool.execute('SELECT * FROM festivos ORDER BY fecha');
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Agregar festivo
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

    // Eliminar festivo
    static async deleteFestivo(id) {
        try {
            const [result] = await db.pool.execute('DELETE FROM festivos WHERE id = ?', [id]);
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si una fecha es festiva
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

    // Obtener configuración para uso en calendario
    static async getConfiguracionParaCalendario() {
        try {
            const config = await this.getConfiguracion();
            if (!config) return null;

            // Parsear días de apertura si es necesario
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