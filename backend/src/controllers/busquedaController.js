const db = require('../config/database');

console.log('[BUSQUEDA] Modulo de busqueda cargado');

const busquedaController = {
  // Búsqueda global (servicios + productos)
  buscarGlobal: async (req, res) => {
    try {
      const { q, categoria, precioMin, precioMax } = req.query;

      console.log('[BUSQUEDA] Busqueda global:', { q, categoria, precioMin, precioMax });

      // Si no hay término de búsqueda, devolver vacío
      if (!q || q.trim() === '') {
        return res.json({
          success: true,
          total: 0,
          resultados: []
        });
      }

      const searchTerm = `%${q}%`;

      // Búsqueda en servicios (mantenemos categoría aquí)
      let queryServicios = `
        SELECT 
          id,
          nombre,
          descripcion,
          precio,
          duracion,
          categoria,
          'servicio' as tipo,
          activo
        FROM servicio 
        WHERE activo = 1 AND nombre LIKE ?
      `;
      let paramsServicios = [searchTerm];

      if (categoria) {
        queryServicios += ' AND categoria = ?';
        paramsServicios.push(categoria);
      }

      // Búsqueda en productos (sin categoría)
      let queryProductos = `
        SELECT 
          id,
          nombre,
          precio,
          stock,
          'producto' as tipo,
          activo
        FROM producto 
        WHERE activo = 1 AND nombre LIKE ?
      `;
      let paramsProductos = [searchTerm];

      // Ejecutar ambas consultas
      const [servicios] = await db.pool.execute(queryServicios, paramsServicios);
      const [productos] = await db.pool.execute(queryProductos, paramsProductos);

      // Combinar resultados
      const resultados = [...servicios, ...productos];

      console.log(`[BUSQUEDA] Encontrados ${resultados.length} resultados para: ${q}`);

      res.json({
        success: true,
        total: resultados.length,
        resultados: resultados
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

  // Búsqueda solo en servicios
  buscarServicios: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Busqueda de servicios:', q);

      if (!q || q.trim() === '') {
        return res.json({
          success: true,
          total: 0,
          servicios: []
        });
      }

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

  // Búsqueda solo en productos
  buscarProductos: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Busqueda de productos:', q);

      if (!q || q.trim() === '') {
        return res.json({
          success: true,
          total: 0,
          productos: []
        });
      }

      const [results] = await db.pool.execute(
        'SELECT id, nombre, precio, stock, activo FROM producto WHERE activo = 1 AND nombre LIKE ?',
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

  // Búsqueda optimizada para sugerencias 
  buscarSugerencias: async (req, res) => {
    try {
      const { q } = req.query;
      console.log('[BUSQUEDA] Generando sugerencias para:', q);

      if (!q || q.trim() === '' || q.length < 2) {
        return res.json({
          success: true,
          total: 0,
          sugerencias: []
        });
      }

      const searchTerm = `%${q}%`;

      // Solo nombres de servicios y productos
      const [servicios] = await db.pool.execute(
        'SELECT nombre FROM servicio WHERE activo = 1 AND nombre LIKE ? LIMIT 5',
        [searchTerm]
      );

      const [productos] = await db.pool.execute(
        'SELECT nombre FROM producto WHERE activo = 1 AND nombre LIKE ? LIMIT 5',
        [searchTerm]
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

  // Obtener categorías
  obtenerCategorias: async (req, res) => {
    try {
      console.log('[BUSQUEDA] Solicitando categorias');

      const [categoriasServicios] = await db.pool.execute(
        'SELECT DISTINCT categoria FROM servicio WHERE activo = 1 AND categoria IS NOT NULL ORDER BY categoria'
      );

      const categorias = categoriasServicios.map(cat => cat.categoria).filter(Boolean);

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