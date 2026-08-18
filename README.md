# TFG Peluquería

Aplicación web Full Stack para la gestión de una peluquería, desarrollada como proyecto de Trabajo de Fin de Grado (TFG).

El sistema permite gestionar clientes, trabajadores, administradores, reservas, productos, calendario, ausencias y estadísticas desde una aplicación web con arquitectura separada entre frontend, backend y base de datos.

## 🚀 Funcionalidades

- Autenticación y autorización mediante JWT.
- Gestión de usuarios y roles:
  - Cliente
  - Trabajador
  - Administrador
- Gestión de reservas con filtros y distintos criterios de búsqueda.
- Calendario de reservas y organización de la actividad del salón.
- Gestión de trabajadores y ausencias.
- Gestión de productos y ventas.
- Dashboard con información y estadísticas de la actividad.
- Simulación de pagos mediante PayPal.
- API REST para la comunicación entre frontend y backend.
- Aplicación preparada para ejecutarse mediante Docker Compose.

## 🛠️ Tecnologías

### Frontend

- Angular
- TypeScript
- HTML5 / CSS3
- Nginx

### Backend

- Node.js
- Express.js
- API REST
- JSON Web Tokens (JWT)

### Base de datos

- MySQL

### Infraestructura

- Docker
- Docker Compose
- Nginx

## 🏗️ Arquitectura

El proyecto está organizado siguiendo una arquitectura de frontend, backend y base de datos:

```text
                    ┌──────────────────┐
                    │     Angular      │
                    │    Frontend      │
                    └────────┬─────────┘
                             │ HTTP / REST
                             ▼
                    ┌──────────────────┐
                    │ Node.js +        │
                    │ Express.js       │
                    │     Backend      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │      MySQL       │
                    │    Database      │
                    └──────────────────┘
```

El frontend se sirve mediante Nginx y los distintos servicios se gestionan mediante Docker Compose.

## 🔐 Configuración

El proyecto utiliza variables de entorno para configurar aspectos como la conexión con la base de datos, JWT y CORS.

Por seguridad, los valores reales no se incluyen en el repositorio. Consulta `.env.example` como referencia para conocer las variables necesarias.

## 🐳 Ejecución con Docker

El proyecto está preparado para ejecutarse mediante Docker Compose.

De forma general, el flujo consiste en configurar las variables de entorno necesarias y levantar los servicios definidos en `docker-compose.yml`.

> Este repositorio corresponde a un proyecto académico desarrollado y probado en entorno local.

## 📁 Estructura general

```text
TFG_Peluqueria/
├── backend/          # API REST y lógica del servidor
├── frontend/         # Aplicación Angular
├── database/         # Recursos relacionados con la base de datos
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🎓 Contexto del proyecto

Este proyecto fue desarrollado como Trabajo de Fin de Grado del ciclo de Desarrollo de Aplicaciones Web (DAW), con el objetivo de aplicar de forma conjunta conocimientos de desarrollo frontend, backend, bases de datos, APIs REST, autenticación, Docker y despliegue de servicios.

## 👨‍💻 Autor

**Manuel Barbado**  
Desarrollador Web Junior | Full Stack

[GitHub](https://github.com/Manolo2701)
