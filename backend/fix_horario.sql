USE peluqueria_selene;

UPDATE trabajador SET 
horario_laboral = '{\"Lunes\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}, \"Martes\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}, \"Miércoles\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}, \"Jueves\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}, \"Viernes\": {\"inicio\": \"09:00\", \"fin\": \"18:00\"}}',
especialidades = '[\"peluqueria\", \"coloración\"]'
WHERE id = 1;