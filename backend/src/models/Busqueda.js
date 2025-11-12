const db = require('../config/database');

class Busqueda {
    // Búsqueda inteligente en servicios y productos
    static async buscarGlobal(termino, filtros = {}) {
        try {
            const { categoria, tipo, precioMin, precioMax, ordenarPor = 'relevancia' } = filtros;

            let resultados = [];

            // Si no hay término de búsqueda, devolver vacío
            if (!termino || termino.trim() === '') {
                return resultados;
            }

            const terminoLike = `%${termino}%`;

            // Búsqueda en servicios
            if (!tipo || tipo === 'servicios') {
                let queryServicios = `
          SELECT 
            id,
            nombre,
            descripcion,
            precio,
            duracion,
            categoria,
            'servicio' as tipo,
            activo,
            CASE 
              WHEN nombre LIKE ? THEN 3
              WHEN descripcion LIKE ? THEN 2
              WHEN categoria LIKE ? THEN 1
              ELSE 0
            END as relevancia
          FROM servicio 
          WHERE activo = 1
            AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)
        `;

                let paramsServicios = [
                    terminoLike, terminoLike, terminoLike, // para el CASE
                    terminoLike, terminoLike, terminoLike  // para el WHERE
                ];

                // Aplicar filtros adicionales para servicios
                if (categoria) {
                    queryServicios += ' AND categoria = ?';
                    paramsServicios.push(categoria);
                }
                if (precioMin !== undefined) {
                    queryServicios += ' AND precio >= ?';
                    paramsServicios.push(precioMin);
                }
                if (precioMax !== undefined) {
                    queryServicios += ' AND precio <= ?';
                    paramsServicios.push(precioMax);
                }

                queryServicios += ' ORDER BY relevancia DESC, nombre ASC';

                const [servicios] = await db.pool.execute(queryServicios, paramsServicios);
                resultados = resultados.concat(servicios);
            }

            // Búsqueda en productos
            if (!tipo || tipo === 'productos') {
                let queryProductos = `
          SELECT 
            id,
            nombre,
            descripcion,
            precio,
            stock,
            categoria,
            'producto' as tipo,
            activo,
            CASE 
              WHEN nombre LIKE ? THEN 3
              WHEN descripcion LIKE ? THEN 2
              WHEN categoria LIKE ? THEN 1
              ELSE 0
            END as relevancia
          FROM producto 
          WHERE activo = 1
            AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)
        `;

                let paramsProductos = [
                    terminoLike, terminoLike, terminoLike, // para el CASE
                    terminoLike, terminoLike, terminoLike  // para el WHERE
                ];

                // Aplicar filtros adicionales para productos
                if (categoria) {
                    queryProductos += ' AND categoria = ?';
                    paramsProductos.push(categoria);
                }
                if (precioMin !== undefined) {
                    queryProductos += ' AND precio >= ?';
                    paramsProductos.push(precioMin);
                }
                if (precioMax !== undefined) {
                    queryProductos += ' AND precio <= ?';
                    paramsProductos.push(precioMax);
                }

                queryProductos += ' ORDER BY relevancia DESC, nombre ASC';

                const [productos] = await db.pool.execute(queryProductos, paramsProductos);
                resultados = resultados.concat(productos);
            }

            // Ordenar resultados globales si hay mezcla
            if (resultados.length > 0 && (!tipo || tipo === 'todos')) {
                resultados.sort((a, b) => {
                    if (b.relevancia !== a.relevancia) {
                        return b.relevancia - a.relevancia;
                    }
                    return a.nombre.localeCompare(b.nombre);
                });
            }

            return resultados;
        } catch (error) {
            console.error('❌ Error en búsqueda global:', error);
            throw error;
        }
    }

    // Búsqueda solo en servicios
    static async buscarServicios(termino, filtros = {}) {
        try {
            const { categoria, precioMin, precioMax } = filtros;

            if (!termino || termino.trim() === '') {
                return [];
            }

            const terminoLike = `%${termino}%`;

            let query = `
        SELECT 
          id,
          nombre,
          descripcion,
          precio,
          duracion,
          categoria,
          'servicio' as tipo,
          activo,
          CASE 
            WHEN nombre LIKE ? THEN 3
            WHEN descripcion LIKE ? THEN 2
            WHEN categoria LIKE ? THEN 1
            ELSE 0
          END as relevancia
        FROM servicio 
        WHERE activo = 1
          AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)
      `;

            let params = [
                terminoLike, terminoLike, terminoLike, // para el CASE
                terminoLike, terminoLike, terminoLike  // para el WHERE
            ];

            if (categoria) {
                query += ' AND categoria = ?';
                params.push(categoria);
            }
            if (precioMin !== undefined) {
                query += ' AND precio >= ?';
                params.push(precioMin);
            }
            if (precioMax !== undefined) {
                query += ' AND precio <= ?';
                params.push(precioMax);
            }

            query += ' ORDER BY relevancia DESC, nombre ASC';

            const [resultados] = await db.pool.execute(query, params);
            return resultados;
        } catch (error) {
            console.error('❌ Error en búsqueda de servicios:', error);
            throw error;
        }
    }

    // Búsqueda solo en productos
    static async buscarProductos(termino, filtros = {}) {
        try {
            const { categoria, precioMin, precioMax } = filtros;

            if (!termino || termino.trim() === '') {
                return [];
            }

            const terminoLike = `%${termino}%`;

            let query = `
        SELECT 
          id,
          nombre,
          descripcion,
          precio,
          stock,
          categoria,
          'producto' as tipo,
          activo,
          CASE 
            WHEN nombre LIKE ? THEN 3
            WHEN descripcion LIKE ? THEN 2
            WHEN categoria LIKE ? THEN 1
            ELSE 0
          END as relevancia
        FROM producto 
        WHERE activo = 1
          AND (nombre LIKE ? OR descripcion LIKE ? OR categoria LIKE ?)
      `;

            let params = [
                terminoLike, terminoLike, terminoLike, // para el CASE
                terminoLike, terminoLike, terminoLike  // para el WHERE
            ];

            if (categoria) {
                query += ' AND categoria = ?';
                params.push(categoria);
            }
            if (precioMin !== undefined) {
                query += ' AND precio >= ?';
                params.push(precioMin);
            }
            if (precioMax !== undefined) {
                query += ' AND precio <= ?';
                params.push(precioMax);
            }

            query += ' ORDER BY relevancia DESC, nombre ASC';

            const [resultados] = await db.pool.execute(query, params);
            return resultados;
        } catch (error) {
            console.error('❌ Error en búsqueda de productos:', error);
            throw error;
        }
    }

    // Búsqueda optimizada para sugerencias (autocompletar)
    static async buscarSugerencias(termino, tipo = 'todos') {
        try {
            if (!termino || termino.trim() === '' || termino.length < 2) {
                return [];
            }

            const terminoLike = `%${termino}%`;

            let query = `
                SELECT 
                    id,
                    nombre,
                    'servicio' as tipo,
                    categoria,
                    precio,
                    3 as relevancia
                FROM servicio 
                WHERE activo = 1 
                AND nombre LIKE ?
                
                UNION ALL
                
                SELECT 
                    id,
                    nombre,
                    'producto' as tipo,
                    categoria,
                    precio,
                    3 as relevancia
                FROM producto 
                WHERE activo = 1 
                AND nombre LIKE ?
            `;

            let params = [terminoLike, terminoLike];

            if (tipo !== 'todos') {
                if (tipo === 'servicios') {
                    query = query.split('UNION ALL')[0];
                    params = [terminoLike];
                } else if (tipo === 'productos') {
                    query = query.split('UNION ALL')[1];
                    params = [terminoLike];
                }
            }

            query += ' ORDER BY relevancia DESC, nombre ASC LIMIT 10';

            const [resultados] = await db.pool.execute(query, params);
            return resultados;
        } catch (error) {
            console.error('❌ Error en búsqueda de sugerencias:', error);
            throw error;
        }
    }

    // Obtener categorías únicas para filtros
    static async obtenerCategorias() {
        try {
            // Categorías de servicios
            const [categoriasServicios] = await db.pool.execute(`
        SELECT DISTINCT categoria, 'servicio' as tipo 
        FROM servicio 
        WHERE activo = 1 
        ORDER BY categoria
      `);

            // Categorías de productos
            const [categoriasProductos] = await db.pool.execute(`
        SELECT DISTINCT categoria, 'producto' as tipo 
        FROM producto 
        WHERE activo = 1 
        ORDER BY categoria
      `);

            return {
                servicios: categoriasServicios.map(cat => cat.categoria),
                productos: categoriasProductos.map(cat => cat.categoria),
                todas: [...new Set([
                    ...categoriasServicios.map(cat => cat.categoria),
                    ...categoriasProductos.map(cat => cat.categoria)
                ])].sort()
            };
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            throw error;
        }
    }
}

module.exports = Busqueda;