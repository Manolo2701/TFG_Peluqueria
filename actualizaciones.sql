-- Actualizar usuario Josefa a administrador
UPDATE usuario 
SET rol = 'administrador' 
WHERE email = 'pelu.selene@gmail.com';

-- Insertar a Josefa como trabajadora si no existe (adaptado a la estructura real)
INSERT IGNORE INTO trabajador (usuario_id, especialidades, descripcion, experiencia, fecha_creacion)
SELECT id, '["Peluquería", "Estética", "Gestión"]', 'Propietaria y administradora de la peluquería', 10, NOW()
FROM usuario 
WHERE email = 'pelu.selene@gmail.com';

-- Actualizar servicios con tildes correctas
UPDATE servicio SET nombre = 'Cejas Dar Forma', descripcion = 'Dar forma a las cejas', categoria = 'Estética' WHERE id = 1;
UPDATE servicio SET nombre = 'Cera Labio Superior', descripcion = 'Depilación con cera del labio superior', categoria = 'Estética' WHERE id = 2;
UPDATE servicio SET nombre = 'Cera Brazos', descripcion = 'Depilación con cera de brazos', categoria = 'Estética' WHERE id = 3;
UPDATE servicio SET nombre = 'Cera Brazos Completos', descripcion = 'Depilación con cera de brazos completos', categoria = 'Estética' WHERE id = 4;
UPDATE servicio SET nombre = 'Cera Medias Piernas', descripcion = 'Depilación con cera de medias piernas', categoria = 'Estética' WHERE id = 5;
UPDATE servicio SET nombre = 'Cera Muslos', descripcion = 'Depilación con cera de muslos', categoria = 'Estética' WHERE id = 6;
UPDATE servicio SET nombre = 'Cera Ingles', descripcion = 'Depilación con cera de ingles', categoria = 'Estética' WHERE id = 7;
UPDATE servicio SET nombre = 'Cera Ingles Brasileñas', descripcion = 'Depilación con cera de ingles brasileñas', categoria = 'Estética' WHERE id = 8;
UPDATE servicio SET nombre = 'Cera Ingles Completas', descripcion = 'Depilación con cera de ingles completas', categoria = 'Estética' WHERE id = 9;
UPDATE servicio SET nombre = 'Cera Axilas', descripcion = 'Depilación con cera de axilas', categoria = 'Estética' WHERE id = 10;
UPDATE servicio SET nombre = 'Cera Glúteos', descripcion = 'Depilación con cera de glúteos', categoria = 'Estética' WHERE id = 11;
UPDATE servicio SET nombre = 'Cera Línea Alba', descripcion = 'Depilación con cera de línea alba', categoria = 'Estética' WHERE id = 12;
UPDATE servicio SET nombre = 'Depilación Eléctrica', descripcion = 'Depilación eléctrica', categoria = 'Estética' WHERE id = 13;
UPDATE servicio SET nombre = 'Cera Pecho', descripcion = 'Depilación con cera de pecho para caballeros', categoria = 'Estética' WHERE id = 14;
UPDATE servicio SET nombre = 'Cera Espalda', descripcion = 'Depilación con cera de espalda para caballeros', categoria = 'Estética' WHERE id = 15;
UPDATE servicio SET nombre = 'Cera Piernas Enteras', descripcion = 'Depilación con cera de piernas enteras para caballeros', categoria = 'Estética' WHERE id = 16;
UPDATE servicio SET nombre = 'Lavar y Peinar', descripcion = 'Lavar y peinar estándar', categoria = 'Peluquería' WHERE id = 17;
UPDATE servicio SET nombre = 'Lavar y Peinar Pelo Largo', descripcion = 'Lavar y peinar para pelo largo', categoria = 'Peluquería' WHERE id = 18;
UPDATE servicio SET nombre = 'Solo Corte', descripcion = 'Corte de cabello estándar', categoria = 'Peluquería' WHERE id = 19;
UPDATE servicio SET nombre = 'Solo Corte Pelo Largo', descripcion = 'Corte de cabello para pelo largo', categoria = 'Peluquería' WHERE id = 20;
UPDATE servicio SET nombre = 'Cortar y Peinar Pelo Corto', descripcion = 'Corte y peinado para pelo corto', categoria = 'Peluquería' WHERE id = 21;
UPDATE servicio SET nombre = 'Cortar y Peinar Pelo Largo', descripcion = 'Corte y peinado para pelo largo', categoria = 'Peluquería' WHERE id = 22;
UPDATE servicio SET nombre = 'Corte Máquina', descripcion = 'Corte con máquina', categoria = 'Peluquería' WHERE id = 23;
UPDATE servicio SET nombre = 'Corte Niño/a', descripcion = 'Corte de cabello para niños/as', categoria = 'Peluquería' WHERE id = 24;
UPDATE servicio SET nombre = 'Corte Caballero', descripcion = 'Corte de cabello para caballeros', categoria = 'Peluquería' WHERE id = 25;
UPDATE servicio SET nombre = 'Colágeno', descripcion = 'Tratamiento de colágeno para la piel', categoria = 'Tratamientos' WHERE id = 26;
UPDATE servicio SET nombre = 'Botox', descripcion = 'Tratamiento de botox', categoria = 'Tratamientos' WHERE id = 27;
UPDATE servicio SET nombre = 'Hidratación', descripcion = 'Tratamiento de hidratación profunda', categoria = 'Tratamientos' WHERE id = 28;
UPDATE servicio SET nombre = 'Nutrición', descripcion = 'Tratamiento de nutrición capilar', categoria = 'Tratamientos' WHERE id = 29;