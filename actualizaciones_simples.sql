-- Actualizar trabajador
UPDATE trabajador SET 
especialidades = '[\"Peluquería\", \"Estética\", \"Gestión\"]',
descripcion = 'Propietaria y administradora de la peluquería'
WHERE id = 1;

-- Actualizar servicios individualmente
UPDATE servicio SET nombre = 'Cejas Dar Forma', categoria = 'Estética' WHERE id = 1;
UPDATE servicio SET nombre = 'Cera Labio Superior', categoria = 'Estética' WHERE id = 2;
UPDATE servicio SET nombre = 'Lavar y Peinar', categoria = 'Peluquería' WHERE id = 17;
UPDATE servicio SET nombre = 'Colágeno', categoria = 'Tratamientos' WHERE id = 26;