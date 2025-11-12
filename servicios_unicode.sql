-- Eliminar todos los servicios existentes
DELETE FROM servicio;

-- Reiniciar el contador auto_increment
ALTER TABLE servicio AUTO_INCREMENT = 1;

-- Insertar servicios de ESTÉTICA con secuencias Unicode
INSERT INTO servicio (nombre, descripcion, precio, duracion, categoria) VALUES
('Cejas Dar Forma', 'Dar forma a las cejas', 5.00, 15, 'Est\u00e9tica'),
('Cera Labio Superior', 'Depilaci\u00f3n con cera del labio superior', 3.00, 15, 'Est\u00e9tica'),
('Cera Brazos', 'Depilaci\u00f3n con cera de brazos', 8.00, 30, 'Est\u00e9tica'),
('Cera Brazos Completos', 'Depilaci\u00f3n con cera de brazos completos', 10.00, 45, 'Est\u00e9tica'),
('Cera Medias Piernas', 'Depilaci\u00f3n con cera de medias piernas', 10.00, 30, 'Est\u00e9tica'),
('Cera Muslos', 'Depilaci\u00f3n con cera de muslos', 12.00, 30, 'Est\u00e9tica'),
('Cera Ingles', 'Depilaci\u00f3n con cera de ingles', 6.00, 20, 'Est\u00e9tica'),
('Cera Ingles Brasile\u00f1as', 'Depilaci\u00f3n con cera de ingles brasile\u00f1as', 8.00, 45, 'Est\u00e9tica'),
('Cera Ingles Completas', 'Depilaci\u00f3n con cera de ingles completas', 10.00, 60, 'Est\u00e9tica'),
('Cera Axilas', 'Depilaci\u00f3n con cera de axilas', 8.00, 15, 'Est\u00e9tica'),
('Cera Gl\u00fateos', 'Depilaci\u00f3n con cera de gl\u00fateos', 6.00, 30, 'Est\u00e9tica'),
('Cera L\u00ednea Alba', 'Depilaci\u00f3n con cera de l\u00ednea alba', 5.00, 10, 'Est\u00e9tica'),
('Depilaci\u00f3n El\u00e9ctrica', 'Depilaci\u00f3n el\u00e9ctrica', 6.00, 60, 'Est\u00e9tica'),

-- Estética para caballeros
('Cera Pecho', 'Depilaci\u00f3n con cera de pecho para caballeros', 15.00, 30, 'Est\u00e9tica'),
('Cera Espalda', 'Depilaci\u00f3n con cera de espalda para caballeros', 15.00, 45, 'Est\u00e9tica'),
('Cera Piernas Enteras', 'Depilaci\u00f3n con cera de piernas enteras para caballeros', 16.00, 60, 'Est\u00e9tica'),

-- Insertar servicios de PELUQUERÍA con secuencias Unicode
('Lavar y Peinar', 'Lavar y peinar est\u00e1ndar', 10.00, 30, 'Peluquer\u00eda'),
('Lavar y Peinar Pelo Largo', 'Lavar y peinar para pelo largo', 12.00, 45, 'Peluquer\u00eda'),
('Solo Corte', 'Corte de cabello est\u00e1ndar', 10.00, 30, 'Peluquer\u00eda'),
('Solo Corte Pelo Largo', 'Corte de cabello para pelo largo', 12.00, 45, 'Peluquer\u00eda'),
('Cortar y Peinar Pelo Corto', 'Corte y peinado para pelo corto', 13.00, 45, 'Peluquer\u00eda'),
('Cortar y Peinar Pelo Largo', 'Corte y peinado para pelo largo', 16.00, 60, 'Peluquer\u00eda'),
('Corte M\u00e1quina', 'Corte con m\u00e1quina', 5.00, 20, 'Peluquer\u00eda'),
('Corte Ni\u00f1o/a', 'Corte de cabello para ni\u00f1os/as', 8.00, 30, 'Peluquer\u00eda'),
('Corte Caballero', 'Corte de cabello para caballeros', 8.00, 30, 'Peluquer\u00eda'),

-- Tratamientos (parte de Peluquería)
('Col\u00e1geno', 'Tratamiento de col\u00e1geno para la piel', 10.00, 60, 'Peluquer\u00eda'),
('Botox', 'Tratamiento de botox', 30.00, 90, 'Peluquer\u00eda'),
('Hidrataci\u00f3n', 'Tratamiento de hidrataci\u00f3n profunda', 30.00, 45, 'Peluquer\u00eda'),
('Nutrici\u00f3n', 'Tratamiento de nutrici\u00f3n capilar', 30.00, 60, 'Peluquer\u00eda');

-- Verificar la inserción
SELECT '=== VERIFICACIÓN CON UNICODE ===' as '';
SELECT id, nombre, precio, categoria FROM servicio ORDER BY categoria, id;