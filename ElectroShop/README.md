# 🔌 ElectroShop

Tienda en línea de componentes electrónicos. Proyecto full‑stack con **Node.js + Express + MongoDB** en el backend y **HTML/CSS/JavaScript** en el frontend.

> 🇬🇧 English version below / Versión en inglés al final.

---

## 📁 Estructura del proyecto

```
ElectroShop/
├── electroshop-backend/        # API REST (puerto 5000)
│   ├── config/db.js            # Conexión a MongoDB
│   ├── controllers/            # Lógica de cada módulo
│   ├── middlewares/            # auth.js (JWT) y roleAuth.js (roles)
│   ├── models/                 # Modelos Mongoose (User, Producto, Pedido, ...)
│   ├── routes/                 # Rutas /api/*
│   ├── utils/emailService.js   # Envío de correos (Nodemailer)
│   ├── validators/             # Validaciones con express-validator
│   ├── seedAdmin.js            # Crea el usuario administrador
│   ├── seedDatos.js            # Carga datos de ejemplo
│   └── server.js
│
└── electroshop-frontend/       # Sitio web (puerto 5002)
    ├── public/                 # Páginas de cliente (raíz del sitio)
    ├── admin/                  # Panel de administración
    ├── vendedor/               # Panel de vendedor externo
    ├── css/styles.css
    ├── js/                     # api.js, utils.js, estadoPedido.js
    └── server.js
```

## ✨ Funcionalidades

- **Autenticación:** registro, inicio de sesión con JWT, perfil y bloqueo por intentos fallidos.
- **Roles:** `cliente`, `admin` y `vendedor`.
- **Catálogo:** productos, categorías, búsqueda y detalle de producto.
- **Compras:** carrito, checkout y seguimiento de pedidos.
- **Reseñas** de productos.
- **Trade‑In:** el cliente ofrece equipos usados a cambio de crédito.
- **Panel admin:** usuarios, categorías, productos, pedidos, inventario, reseñas, reportes y trade‑in.
- **Panel vendedor:** gestión de sus productos y ventas.
- **Notificaciones por correo** con Nodemailer.

## 🛠️ Requisitos

- [Node.js](https://nodejs.org/) 18 o superior
- [MongoDB](https://www.mongodb.com/) local o MongoDB Atlas
- Una cuenta SMTP para el envío de correos (opcional)

## ⚙️ Instalación

### 1. Backend

```bash
cd electroshop-backend
npm install
```

Crea un archivo `.env` dentro de `electroshop-backend/`:

```env
# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5002

# Base de datos
MONGO_URI=mongodb://localhost:27017/electroshop

# JWT
JWT_SECRET=cambia_esta_clave_secreta
JWT_EXPIRE=7d

# Seguridad de inicio de sesión
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME_MINUTES=15

# Correo (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicacion
EMAIL_FROM="ElectroShop <tu_correo@gmail.com>"

# Administrador inicial (seedAdmin.js)
ADMIN_NOMBRE=Administrador
ADMIN_CORREO=admin@electroshop.com
ADMIN_PASSWORD=Admin123!
```

> ⚠️ No subas el archivo `.env` al repositorio. Agrégalo a `.gitignore`.

Carga los datos iniciales:

```bash
npm run seed:all          # crea el admin y los datos de ejemplo
# o por separado:
npm run seed:admin
npm run seed:datos
npm run seed:datos:reset  # borra y vuelve a cargar los datos de ejemplo
```

Inicia la API:

```bash
npm run dev     # con nodemon
# o
npm start
```

La API queda en `http://localhost:5000/api`.

### 2. Frontend

```bash
cd electroshop-frontend
npm install
npm run dev     # o npm start
```

Abre **http://localhost:5002/** en el navegador.

> El frontend debe abrirse con su servidor Express (puerto 5002), no con Live Server, porque las rutas son absolutas desde `/`.

## 🌐 Rutas del frontend

| URL | Descripción |
|-----|-------------|
| `/` o `/index.html` | Inicio de sesión |
| `/registro.html` | Registro |
| `/catalogo.html`, `/buscar.html`, `/producto.html` | Tienda |
| `/carrito.html`, `/checkout.html` | Compra |
| `/pedidos.html`, `/pedido.html` | Mis pedidos |
| `/perfil.html`, `/tradein.html` | Perfil y Trade‑In |
| `/admin/*.html` | Panel de administración |
| `/vendedor/*.html` | Panel de vendedor |

Las URLs antiguas con `/public/...` se redirigen automáticamente a la nueva ruta.

## 🔗 Endpoints de la API

| Ruta base | Módulo |
|-----------|--------|
| `/api/auth` | Registro, login y perfil |
| `/api/admin/users` | Administración de usuarios |
| `/api/categorias` | Categorías |
| `/api/productos` | Productos |
| `/api/carrito` | Carrito |
| `/api/pedidos` | Pedidos |
| `/api/resenas` | Reseñas |
| `/api/inventario` | Inventario |
| `/api/reportes` | Reportes |
| `/api/tradein` | Trade‑In |
| `/api/vendedor` | Vendedores externos |

## 🧰 Tecnologías

**Backend:** Express, Mongoose, JSON Web Token, bcryptjs, express-validator, Nodemailer, dotenv, CORS, nodemon
**Frontend:** HTML5, CSS3, JavaScript, Express (servidor estático)

---
---

# 🔌 ElectroShop (English)

Online store for electronic components. A full‑stack project with **Node.js + Express + MongoDB** on the backend and **HTML/CSS/JavaScript** on the frontend.

## 📁 Project structure

```
ElectroShop/
├── electroshop-backend/        # REST API (port 5000)
│   ├── config/db.js            # MongoDB connection
│   ├── controllers/            # Logic for each module
│   ├── middlewares/            # auth.js (JWT) and roleAuth.js (roles)
│   ├── models/                 # Mongoose models (User, Producto, Pedido, ...)
│   ├── routes/                 # /api/* routes
│   ├── utils/emailService.js   # Email sending (Nodemailer)
│   ├── validators/             # express-validator rules
│   ├── seedAdmin.js            # Creates the admin user
│   ├── seedDatos.js            # Loads sample data
│   └── server.js
│
└── electroshop-frontend/       # Website (port 5002)
    ├── public/                 # Customer pages (site root)
    ├── admin/                  # Admin panel
    ├── vendedor/               # External seller panel
    ├── css/styles.css
    ├── js/                     # api.js, utils.js, estadoPedido.js
    └── server.js
```

## ✨ Features

- **Authentication:** sign‑up, JWT login, profile, and lockout after failed attempts.
- **Roles:** `cliente` (customer), `admin`, and `vendedor` (seller).
- **Catalog:** products, categories, search, and product detail.
- **Shopping:** cart, checkout, and order tracking.
- **Product reviews.**
- **Trade‑In:** customers offer used devices in exchange for credit.
- **Admin panel:** users, categories, products, orders, inventory, reviews, reports, and trade‑in.
- **Seller panel:** manage their own products and sales.
- **Email notifications** with Nodemailer.

## 🛠️ Requirements

- [Node.js](https://nodejs.org/) 18 or later
- [MongoDB](https://www.mongodb.com/), local or MongoDB Atlas
- An SMTP account for sending emails (optional)

## ⚙️ Setup

### 1. Backend

```bash
cd electroshop-backend
npm install
```

Create a `.env` file in `electroshop-backend/` with the variables shown in the Spanish section above (`PORT`, `NODE_ENV`, `FRONTEND_URL`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `MAX_LOGIN_ATTEMPTS`, `LOCK_TIME_MINUTES`, `EMAIL_*`, `ADMIN_*`).

> ⚠️ Don't commit the `.env` file. Add it to `.gitignore`.

Seed the database:

```bash
npm run seed:all          # creates the admin and sample data
npm run seed:datos:reset  # wipes and reloads sample data
```

Start the API:

```bash
npm run dev     # with nodemon
# or
npm start
```

The API runs at `http://localhost:5000/api`.

### 2. Frontend

```bash
cd electroshop-frontend
npm install
npm run dev     # or npm start
```

Open **http://localhost:5002/** in your browser.

> Run the frontend through its Express server (port 5002), not Live Server, because the paths are absolute from `/`.

## 🌐 Frontend routes

| URL | Description |
|-----|-------------|
| `/` or `/index.html` | Login |
| `/registro.html` | Sign‑up |
| `/catalogo.html`, `/buscar.html`, `/producto.html` | Store |
| `/carrito.html`, `/checkout.html` | Checkout |
| `/pedidos.html`, `/pedido.html` | My orders |
| `/perfil.html`, `/tradein.html` | Profile and Trade‑In |
| `/admin/*.html` | Admin panel |
| `/vendedor/*.html` | Seller panel |

Old `/public/...` URLs are redirected to the new paths automatically.

## 🔗 API endpoints

| Base route | Module |
|------------|--------|
| `/api/auth` | Sign‑up, login, and profile |
| `/api/admin/users` | User administration |
| `/api/categorias` | Categories |
| `/api/productos` | Products |
| `/api/carrito` | Cart |
| `/api/pedidos` | Orders |
| `/api/resenas` | Reviews |
| `/api/inventario` | Inventory |
| `/api/reportes` | Reports |
| `/api/tradein` | Trade‑In |
| `/api/vendedor` | External sellers |

## 🧰 Tech stack

**Backend:** Express, Mongoose, JSON Web Token, bcryptjs, express-validator, Nodemailer, dotenv, CORS, nodemon
**Frontend:** HTML5, CSS3, JavaScript, Express (static server)
