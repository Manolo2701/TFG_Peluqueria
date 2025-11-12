-- Eliminar todos los servicios existentes
DELETE FROM servicio;

-- Reiniciar el contador auto_increment
ALTER TABLE servicio AUTO_INCREMENT = 1;

-- Insertar servicios de ESTÉTICA
INSERT INTO servicio (nombre, descripcion, precio, duracion, categoria) VALUES
('Cejas Dar Forma', 'Dar forma a las cejas', 5.00, 15, 'Estética'),
('Cera Labio Superior', 'Depilación con cera del labio superior', 3.00, 15, 'Estética'),
('Cera Brazos', 'Depilación con cera de brazos', 8.00, 30, 'Estética'),
('Cera Brazos Completos', 'Depilación con cera de brazos completos', 10.00, 45, 'Estética'),
('Cera Medias Piernas', 'Depilación con cera de medias piernas', 10.00, 30, 'Estética'),
('Cera Muslos', 'Depilación con cera de muslos', 12.00, 30, 'Estética'),
('Cera Ingles', 'Depilación con cera de ingles', 6.00, 20, 'Estética'),
('Cera Ingles Brasileñas', 'Depilación con cera de ingles brasileñas', 8.00, 45, 'Estética'),
('Cera Ingles Completas', 'Depilación con cera de ingles completas', 10.00, 60, 'Estética'),
('Cera Axilas', 'Depilación con cera de axilas', 8.00, 15, 'Estética'),
('Cera Glúteos', 'Depilación con cera de glúteos', 6.00, 30, 'Estética'),
('Cera Línea Alba', 'Depilación con cera de línea alba', 5.00, 10, 'Estética'),
('Depilación Eléctrica', 'Depilación eléctrica', 6.00, 60, 'Estética'),

-- Estética para caballeros
('Cera Pecho', 'Depilación con cera de pecho para caballeros', 15.00, 30, 'Estética'),
('Cera Espalda', 'Depilación con cera de espalda para caballeros', 15.00, 45, 'Estética'),
('Cera Piernas Enteras', 'Depilación con cera de piernas enteras para caballeros', 16.00, 60, 'Estética'),

-- Insertar servicios de PELUQUERÍA (incluyendo tratamientos)
('Lavar y Peinar', 'Lavar y peinar estándar', 10.00, 30, 'Peluquería'),
('Lavar y Peinar Pelo Largo', 'Lavar y peinar para pelo largo', 12.00, 45, 'Peluquería'),
('Solo Corte', 'Corte de cabello estándar', 10.00, 30, 'Peluquería'),
('Solo Corte Pelo Largo', 'Corte de cabello para pelo largo', 12.00, 45, 'Peluquería'),
('Cortar y Peinar Pelo Corto', 'Corte y peinado para pelo corto', 13.00, 45, 'Peluquería'),
('Cortar y Peinar Pelo Largo', 'Corte y peinado para pelo largo', 16.00, 60, 'Peluquería'),
('Corte Máquina', 'Corte con máquina', 5.00, 20, 'Peluquería'),
('Corte Niño/a', 'Corte de cabello para niños/as', 8.00, 30, 'Peluquería'),
('Corte Caballero', 'Corte de cabello para caballeros', 8.00, 30, 'Peluquería'),

-- Tratamientos (parte de Peluquería)
('Colágeno', 'Tratamiento de colágeno para la piel', 10.00, 60, 'Peluquería'),
('Botox', 'Tratamiento de botox', 30.00, 90, 'Peluquería'),
('Hidratación', 'Tratamiento de hidratación profunda', 30.00, 45, 'Peluquería'),
('Nutrición', 'Tratamiento de nutrición capilar', 30.00, 60, 'Peluquería');

-- Verificar la inserción
SELECT '=== TOTAL SERVICIOS INSERTADOS ===' as '';
SELECT COUNT(*) as total_servicios FROM servicio;

SELECT '=== SERVICIOS POR CATEGORÍA ===' as '';
SELECT categoria, COUNT(*) as total, CONCAT('€', FORMAT(SUM(precio), 2)) as precio_total 
FROM servicio 
GROUP BY categoria 
ORDER BY categoria;

SELECT '=== LISTA COMPLETA DE SERVICIOS ===' as '';
SELECT id, nombre, precio, duracion, categoria 
FROM servicio 
ORDER BY categoria, nombre;