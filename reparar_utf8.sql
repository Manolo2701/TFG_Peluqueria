-- Configurar UTF-8 para toda la sesiÃ³n
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Asegurar que la base de datos use UTF-8
ALTER DATABASE peluqueria_selene CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Reparar la tabla trabajador primero (los datos estÃ¡n corruptos)
UPDATE trabajador SET 
    especialidades = '["PeluquerÃ­a", "EstÃ©tica", "GestiÃ³n"]',
    descripcion = 'Propietaria y administradora de la peluquerÃ­a'
WHERE usuario_id = (SELECT id FROM usuario WHERE email = 'pelu.selene@gmail.com');

-- Reparar servicios uno por uno con caracteres UTF-8 explÃ­citos
UPDATE servicio SET nombre = 'Cejas Dar Forma', descripcion = 'Dar forma a las cejas', categoria = 'EstÃ©tica' WHERE id = 1;
UPDATE servicio SET nombre = 'Cera Labio Superior', descripcion = 'DepilaciÃ³n con cera del labio superior', categoria = 'EstÃ©tica' WHERE id = 2;
UPDATE servicio SET nombre = 'Cera Brazos', descripcion = 'DepilaciÃ³n con cera de brazos', categoria = 'EstÃ©tica' WHERE id = 3;
UPDATE servicio SET nombre = 'Cera Brazos Completos', descripcion = 'DepilaciÃ³n con cera de brazos completos', categoria = 'EstÃ©tica' WHERE id = 4;
UPDATE servicio SET nombre = 'Cera Medias Piernas', descripcion = 'DepilaciÃ³n con cera de medias piernas', categoria = 'EstÃ©tica' WHERE id = 5;
UPDATE servicio SET nombre = 'Cera Muslos', descripcion = 'DepilaciÃ³n con cera de muslos', categoria = 'EstÃ©tica' WHERE id = 6;
UPDATE servicio SET nombre = 'Cera Ingles', descripcion = 'DepilaciÃ³n con cera de ingles', categoria = 'EstÃ©tica' WHERE id = 7;
UPDATE servicio SET nombre = 'Cera Ingles BrasileÃ±as', descripcion = 'DepilaciÃ³n con cera de ingles brasileÃ±as', categoria = 'EstÃ©tica' WHERE id = 8;
UPDATE servicio SET nombre = 'Cera Ingles Completas', descripcion = 'DepilaciÃ³n con cera de ingles completas', categoria = 'EstÃ©tica' WHERE id = 9;
UPDATE servicio SET nombre = 'Cera Axilas', descripcion = 'DepilaciÃ³n con cera de axilas', categoria = 'EstÃ©tica' WHERE id = 10;
UPDATE servicio SET nombre = 'Cera GlÃºteos', descripcion = 'DepilaciÃ³n con cera de glÃºteos', categoria = 'EstÃ©tica' WHERE id = 11;
UPDATE servicio SET nombre = 'Cera LÃ­nea Alba', descripcion = 'DepilaciÃ³n con cera de lÃ­nea alba', categoria = 'EstÃ©tica' WHERE id = 12;
UPDATE servicio SET nombre = 'DepilaciÃ³n ElÃ©ctrica', descripcion = 'DepilaciÃ³n elÃ©ctrica', categoria = 'EstÃ©tica' WHERE id = 13;
UPDATE servicio SET nombre = 'Cera Pecho', descripcion = 'DepilaciÃ³n con cera de pecho para caballeros', categoria = 'EstÃ©tica' WHERE id = 14;
UPDATE servicio SET nombre = 'Cera Espalda', descripcion = 'DepilaciÃ³n con cera de espalda para caballeros', categoria = 'EstÃ©tica' WHERE id = 15;
UPDATE servicio SET nombre = 'Cera Piernas Enteras', descripcion = 'DepilaciÃ³n con cera de piernas enteras para caballeros', categoria = 'EstÃ©tica' WHERE id = 16;
UPDATE servicio SET nombre = 'Lavar y Peinar', descripcion = 'Lavar y peinar estÃ¡ndar', categoria = 'PeluquerÃ­a' WHERE id = 17;
UPDATE servicio SET nombre = 'Lavar y Peinar Pelo Largo', descripcion = 'Lavar y peinar para pelo largo', categoria = 'PeluquerÃ­a' WHERE id = 18;
UPDATE servicio SET nombre = 'Solo Corte', descripcion = 'Corte de cabello estÃ¡ndar', categoria = 'PeluquerÃ­a' WHERE id = 19;
UPDATE servicio SET nombre = 'Solo Corte Pelo Largo', descripcion = 'Corte de cabello para pelo largo', categoria = 'PeluquerÃ­a' WHERE id = 20;
UPDATE servicio SET nombre = 'Cortar y Peinar Pelo Corto', descripcion = 'Corte y peinado para pelo corto', categoria = 'PeluquerÃ­a' WHERE id = 21;
UPDATE servicio SET nombre = 'Cortar y Peinar Pelo Largo', descripcion = 'Corte y peinado para pelo largo', categoria = 'PeluquerÃ­a' WHERE id = 22;
UPDATE servicio SET nombre = 'Corte MÃ¡quina', descripcion = 'Corte con mÃ¡quina', categoria = 'PeluquerÃ­a' WHERE id = 23;
UPDATE servicio SET nombre = 'Corte NiÃ±o/a', descripcion = 'Corte de cabello para niÃ±os/as', categoria = 'PeluquerÃ­a' WHERE id = 24;
UPDATE servicio SET nombre = 'Corte Caballero', descripcion = 'Corte de cabello para caballeros', categoria = 'PeluquerÃ­a' WHERE id = 25;
UPDATE servicio SET nombre = 'ColÃ¡geno', descripcion = 'Tratamiento de colÃ¡geno para la piel', categoria = 'Tratamientos' WHERE id = 26;
UPDATE servicio SET nombre = 'Botox', descripcion = 'Tratamiento de botox', categoria = 'Tratamientos' WHERE id = 27;
UPDATE servicio SET nombre = 'HidrataciÃ³n', descripcion = 'Tratamiento de hidrataciÃ³n profunda', categoria = 'Tratamientos' WHERE id = 28;
UPDATE servicio SET nombre = 'NutriciÃ³n', descripcion = 'Tratamiento de nutriciÃ³n capilar', categoria = 'Tratamientos' WHERE id = 29;

-- Forzar la conversiÃ³n de caracteres de las tablas
ALTER TABLE servicio CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE trabajador CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE usuario CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificar los cambios
SELECT '=== TRABAJADOR REPARADO ===' as '';
SELECT id, usuario_id, especialidades, descripcion FROM trabajador;

SELECT '=== SERVICIOS REPARADOS ===' as '';
SELECT id, nombre, categoria FROM servicio WHERE id IN (1, 2, 17, 26);