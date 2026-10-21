# Peluquería Selene — aplicación de gestión

Aplicación web Full Stack desarrollada como Trabajo de Fin de Grado del ciclo de Desarrollo de Aplicaciones Web (DAW). Permite gestionar la actividad de una peluquería desde una interfaz web con frontend, API REST y base de datos separados.

> **Proyecto académico:** se desarrolló y probó principalmente en entorno local. Los pagos con PayPal están en modo simulación; no se procesan cobros reales. No despliegues esta aplicación públicamente sin revisar configuración, autenticación, permisos y seguridad.

## Funcionalidades principales

- Autenticación y autorización basada en roles.
- Roles de cliente, trabajador y administrador.
- Gestión y consulta de reservas.
- Calendario y disponibilidad de trabajadores.
- Gestión de trabajadores, horarios y ausencias.
- Gestión de productos y ventas.
- Panel con información y estadísticas.
- API REST para la comunicación entre frontend y backend.
- Simulación del flujo de pago.

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Frontend | Angular, TypeScript, HTML, CSS |
| Backend | Node.js, Express.js |
| Base de datos | MySQL |
| Infraestructura | Docker Compose, Nginx |
| Seguridad | JWT, bcrypt y control de roles |

## Arquitectura

```text
Angular (frontend)
       |
       | HTTP / API REST
       v
Node.js + Express (backend)
       |
       v
MySQL (base de datos)
```

Docker Compose coordina los servicios de frontend, backend y base de datos.

## Requisitos

- Docker y Docker Compose
- Git para clonar el repositorio

## Ejecución local con Docker

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Manolo2701/TFG_Peluqueria.git
   cd TFG_Peluqueria
   ```

2. Crea tu archivo local de configuración a partir de la plantilla:

   ```bash
   cp .env.example .env
   ```

   En Windows, puedes copiar `.env.example` y renombrar la copia a `.env`.

3. Edita `.env` y sustituye los valores de ejemplo. `MYSQL_ROOT_PASSWORD` y `DB_PASSWORD` deben coincidir con la contraseña configurada para MySQL en este montaje. Cambia también `JWT_SECRET` por un secreto aleatorio propio. No publiques el archivo `.env`.

4. Construye e inicia los servicios:

   ```bash
   docker compose up --build
   ```

5. Abre la aplicación en `http://localhost`. La API se publica en el puerto `3000` durante el desarrollo local.

Para detener los servicios:

```bash
docker compose down
```

Los datos de MySQL se guardan en un volumen de Docker. Para borrar también los datos persistidos, Docker permite eliminar el volumen con `docker compose down -v`; ten en cuenta que esto elimina la base de datos local.

## Configuración y credenciales

- `.env.example` documenta las variables requeridas.
- `.env` es local y está excluido de Git.
- La configuración de pagos permanece en modo simulación. No necesitas credenciales de PayPal para ese modo.
- Se han retirado de la versión actual las credenciales de ejemplo y las configuraciones sensibles. Los commits antiguos pueden conservar versiones anteriores de esos archivos; si alguna credencial publicada se hubiera usado fuera de este proyecto, debe revocarse o rotarse. El historial no se ha reescrito.

## Estructura general

```text
TFG_Peluqueria/
├── backend/       # API REST y lógica del servidor
├── frontend/      # Aplicación Angular
├── database/      # Esquema e inicialización de MySQL
├── docker-compose.yml
├── .env.example
└── README.md
```

## Contexto académico

El objetivo del proyecto fue integrar conocimientos de frontend, backend, bases de datos, APIs REST, autenticación, control de acceso y contenedores en una aplicación Full Stack.

## Autor

**Manuel Barbado**  
Desarrollador Web Junior | Full Stack  
[GitHub](https://github.com/Manolo2701) · [LinkedIn](https://www.linkedin.com/in/manuel-ramiro-barbado-s%C3%A1nchez-7404b5345/)
