const db = require('../config/database');

console.log('[BUSQUEDA] Modulo de busqueda cargado');

const busquedaController = {
  // NOTA: Estos nombres deben coincidir con las rutas
  buscarGlobal: async (req, res) => {
    try {
      const { q, categoria, precioMin, precioMax } = req.query;

      console.log('[BUSQUEDA] Busqueda global:', { q, categoria, precioMin, precioMax });

      let query = `
        SELECT 'servicio' as tipo, id, nombre, descripcion, precio, categoria, NULL as stock
        FROM servicio 
        WHERE activo = 1 AND nombre LIKE ?
        UNION ALL
        SELECT 'producto' as tipo, id, nombre, descripcion, precio, categoria, stock
        FROM producto 
        WHERE activo = 1 AND nombre LIKE ?
      `;
      
      const searchTerm = `%${q}%`;
      const params = [searchTerm, searchTerm];

      if (categoria) {
        query = query.replace('WHERE activo = 1', 'WHERE activo = 1 AND categoria = ?');
        params.push(categoria);
        params.push(categoria);
      }

      if (precioMin) {
        query += ' AND precio >= ?';
        params.push(precioMin);
        params.push(precioMin);
      }

      if (precioMax) {
        query += ' AND precio <= ?';
        params.push(precioMax);
        params.push(precioMax);
      }

      const [results] = await db.pool.execute(query, params);
      
      console.log(`[BUSQUEDA] Encontrados ${results.length} resultados para: ${q}`);
      
      res.json({
        success: true,
        total: results.length,
        resultados: results
      });

    } catch (error) {
      console.error('[BUSQUEDA] ERROR en busqueda global:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la busqueda',
        error: error.message
      });
    }
  },

  buscarServicios: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Busqueda de servicios:', q);

      const [results] = await db.pool.execute(
        'SELECT * FROM servicio WHERE activo = 1 AND nombre LIKE ?',
        [`%${q}%`]
      );

      console.log(`[BUSQUEDA] Encontrados ${results.length} servicios para: ${q}`);
      
      res.json({
        success: true,
        total: results.length,
        servicios: results
      });

    } catch (error) {
      console.error('[BUSQUEDA] ERROR en busqueda de servicios:', error);
      res.status(500).json({
        success: false,
        message: 'Error buscando servicios',
        error: error.message
      });
    }
  },

  buscarProductos: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Busqueda de productos:', q);

      const [results] = await db.pool.execute(
        'SELECT * FROM producto WHERE activo = 1 AND nombre LIKE ?',
        [`%${q}%`]
      );

      console.log(`[BUSQUEDA] Encontrados ${results.length} productos para: ${q}`);
      
      res.json({
        success: true,
        total: results.length,
        productos: results
      });

    } catch (error) {
      console.error('[BUSQUEDA] ERROR en busqueda de productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error buscando productos',
        error: error.message
      });
    }
  },

  buscarSugerencias: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Generando sugerencias para:', q);

      const [servicios] = await db.pool.execute(
        'SELECT nombre FROM servicio WHERE activo = 1 AND nombre LIKE ? LIMIT 5',
        [`%${q}%`]
      );

      const [productos] = await db.pool.execute(
        'SELECT nombre FROM producto WHERE activo = 1 AND nombre LIKE ? LIMIT 5',
        [`%${q}%`]
      );

      const sugerencias = [
        ...servicios.map(s => s.nombre),
        ...productos.map(p => p.nombre)
      ].slice(0, 8);

      console.log(`[BUSQUEDA] ${sugerencias.length} sugerencias para: ${q}`);
      
      res.json({
        success: true,
        total: sugerencias.length,
        sugerencias: sugerencias
      });

    } catch (error) {
      console.error('[BUSQUEDA] ERROR en sugerencias:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando sugerencias',
        error: error.message
      });
    }
  },

  obtenerCategorias: async (req, res) => {
    try {
      console.log('[BUSQUEDA] Solicitando categorias');

      const [serviciosCat] = await db.pool.execute(
        'SELECT DISTINCT categoria FROM servicio WHERE activo = 1'
      );
      
      const [productosCat] = await db.pool.execute(
        'SELECT DISTINCT categoria FROM producto WHERE activo = 1'
      );

      const categorias = [
        ...new Set([
          ...serviciosCat.map(s => s.categoria),
          ...productosCat.map(p => p.categoria)
        ])
      ].filter(Boolean);

      console.log(`[BUSQUEDA] ${categorias.length} categorias encontradas`);
      
      res.json({
        success: true,
        categorias: categorias
      });

    } catch (error) {
      console.error('[BUSQUEDA] ERROR obteniendo categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo categorias',
        error: error.message
      });
    }
  }
};

module.exports = busquedaController;
