# 🎬 CinemaBook - Proyecto SIS226

Este es un sistema de gestión de venta de entradas de cine.

Este proyecto ha sido desarrollado para la materia **SIS226 Sistemas de Soporte a las decisiones gerenciales**.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Base de Datos**: MongoDB (Mongoose)

## 🚀 Guía de Inicio Rápido

### Prerrequisitos

- Node.js (v18 o superior)
- MongoDB (instalación local o MongoDB Atlas)

### 1. Configuración del Backend

```bash
cd backend
npm install
# Crea un archivo .env basado en env.example y configura tu MONGODB_URI
npm run seed  # (Opcional) Poblar la base de datos con datos de prueba
npm run dev   # Iniciar servidor de desarrollo (puerto 3000)
```

### 2. Configuración del Frontend

```bash
cd frontend
npm install
# Crea un archivo .env.local basado en env.local.example
npm run dev   # Iniciar servidor de desarrollo (puerto 5173)
```

## 🔑 Acceso al Sistema

- **Sitio Público**: [http://localhost:5173](http://localhost:5173)
- **Panel de Administración**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
  - **Usuario**: `demo`
  - **Contraseña**: `demo`

## ✨ Características Principales

- **Sistema de Reservas**: Navegación de películas, selección de sesiones y reserva de asientos.
- **Previsualización de Asientos**: Vista visual de la pantalla y perfil acústico del asiento.
- **Panel de Administración**: Gestión completa de clientes, películas, salas, sesiones, reservas y pagos.
- **Tickets con QR**: Generación automática de códigos QR para entradas digitales.

---
**Realizado para la materia SIS226 - Sistemas de Soporte a las decisiones gerenciales**
