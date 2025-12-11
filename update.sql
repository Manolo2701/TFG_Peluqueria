UPDATE configuracion_negocio
SET categorias_especialidades = '{
  "Peluquería": ["Cortes de cabello", "Coloración"],
  "Estética": ["Depilación", "Maquillaje"]
}'
WHERE id = 1;
