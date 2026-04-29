# Smart Campus UIS – Módulo Web de Administración basado en Gemelo Digital

## 📌 Descripción del proyecto
Este repositorio contiene el desarrollo del **módulo web de administración** para la plataforma **Smart Campus UIS**, cuyo objetivo es permitir la gestión centralizada de dispositivos y aplicaciones IoT mediante el enfoque de **Gemelo Digital (Digital Twin)**.

El sistema permite:

- Registrar y administrar dispositivos IoT con sus propiedades
- Representar cada dispositivo mediante un gemelo digital sincronizado
- Recibir telemetría en tiempo real vía MQTT y WebSocket
- Visualizar el grafo de gemelos digitales de forma interactiva
- Monitorear KPIs del campus y configurar alertas por umbrales
- Gestionar usuarios con roles diferenciados (ADMIN / USER)
- Exportar inventario de dispositivos en CSV y PDF
- Detectar y gestionar dispositivos desconocidos automáticamente

Este proyecto hace parte del **Trabajo de Grado de Ingeniería de Sistemas – UIS**.

---

## 👨‍💻 Autores
- Juan Pablo Avila Quitian
- Juan Camilo Robayo Giraldo
- Jean Carlo Rodríguez Pico

---

## 🏗️ Tecnologías utilizadas

### Backend
- Java 21 (LTS)
- Spring Boot 3.3.5
- Spring Web (REST APIs)
- Spring Data JPA (ORM)
- Spring Security + JWT
- WebSocket / STOMP (tiempo real)
- MQTT (ingesta de telemetría)
- Maven

### Frontend
- React 18 + Vite
- React Flow (visualización de grafo de gemelos digitales)
- SockJS + STOMP (WebSocket cliente)
- jsPDF + AutoTable (exportación PDF)
- CSS Variables (tema oscuro personalizado)

### Base de datos
- MySQL 8.x

### Otras herramientas
- Lombok
- Git / GitHub
- Postman (pruebas API)

---

## 🗄️ Arquitectura general

El sistema sigue una arquitectura por capas:

```
Controller → Service → Repository → Database
```

### Flujo de telemetría en tiempo real

```
Dispositivo IoT → MQTT Broker → Backend (validación) → DigitalTwin (JSON)
                                                              ↓
                                              WebSocket → Frontend (React)
```

### Componentes principales del backend

| Módulo | Responsabilidad |
|--------|----------------|
| DeviceController | CRUD de dispositivos |
| DigitalTwinController | Gestión de gemelos digitales y recepción de telemetría |
| TelemetryController | Historial de registros de telemetría |
| PropertyController | CRUD de propiedades reutilizables |
| AlertRuleController | Gestión de reglas de alerta por umbral |
| UserController | Gestión de usuarios y roles |
| WebSocketConfig | Configuración de broker STOMP para tiempo real |

---

## 📐 Modelo de datos

```
Device (1) ──────── (1) DigitalTwin
   │                        │
   │                   telemetryJson (JSON flexible)
   │
   └── (N) Property (ManyToMany)
   └── (N) TelemetryRecord (historial)

AlertRule → referencia a Device + propiedad + umbral + operador
User → rol (ADMIN | USER)
```

---

## 🖥️ Interfaz web (Frontend)

### Navegación por tabs

| Tab | Descripción |
|-----|-------------|
| Dashboard | KPIs del sistema (dispositivos, twins, telemetría, alertas activas) |
| Dispositivos | Gestión completa de dispositivos con filtros avanzados |
| Propiedades | Gestión de propiedades reutilizables para dispositivos |
| Grafo de Twins | Visualización interactiva del grafo de gemelos digitales |
| Panel de Telemetría | Análisis histórico de telemetría por dispositivo y rango de fechas |
| Alertas | Configuración de reglas de alerta por umbral |
| Usuarios *(solo ADMIN)* | Gestión de cuentas y roles de usuario |

### Módulo de Dispositivos
- Filtros: texto (código/nombre), namespace, tipo, estado, **tags**
- Vista en cuadrícula o lista
- Exportación de inventario como **CSV** y **PDF**
- Detección automática de **dispositivos desconocidos** con opción de registro
- Modo mantenimiento por dispositivo
- Sincronización bidireccional twin ↔ dispositivo físico
- Carga masiva de dispositivos desde archivo **YAML**

### Grafo de Gemelos Digitales (`TwinGraph`)
- Visualización con **React Flow**: cada gemelo es un nodo interactivo
- Los nodos muestran: nombre del twin, código del dispositivo, tipo, estado y valores de telemetría en tiempo real
- Nodos con datos activos **pulsan en verde** (indicador de datos en vivo por WebSocket)
- Clic en un nodo → panel lateral con información completa y telemetría detallada
- Controles de **zoom, pan y minimapa**
- Nodos arrastrables para reorganizar la vista

### Sistema de Alertas en Tiempo Real
- Reglas configurables: propiedad + operador (> / <) + umbral
- Notificaciones **toast** en pantalla vía WebSocket cuando se supera un umbral
- Dashboard de KPIs con conteo de alertas activas

---

## 🔌 API REST — Endpoints principales

### Dispositivos
```
GET    /devices          → Listar todos
GET    /devices/{id}     → Obtener por ID
POST   /devices          → Crear dispositivo (genera twin automáticamente)
PUT    /devices/{id}     → Actualizar
DELETE /devices/{id}     → Eliminar
```

### Gemelos Digitales
```
GET    /twins            → Listar todos
GET    /twins/{id}       → Obtener por ID
POST   /twins            → Crear
PUT    /twins/{id}       → Actualizar
DELETE /twins/{id}       → Eliminar
POST   /twins/{deviceId} → Recibir telemetría para un dispositivo
```

### Telemetría
```
GET    /telemetry                    → Historial completo
GET    /telemetry/device/{deviceId}  → Por dispositivo
GET    /telemetry/history/{code}     → Por código de dispositivo
POST   /telemetry/{code}             → Registrar telemetría
```

### Propiedades
```
GET    /properties       → Listar
POST   /properties       → Crear
PUT    /properties/{id}  → Actualizar
DELETE /properties/{id}  → Eliminar
```

### Alertas
```
GET    /alert-rules      → Listar reglas
POST   /alert-rules      → Crear regla
DELETE /alert-rules/{id} → Eliminar regla
```

### Usuarios
```
GET    /users            → Listar (solo ADMIN)
POST   /auth/register    → Registrar usuario
POST   /auth/login       → Login (retorna JWT)
DELETE /users/{id}       → Eliminar usuario
```

---

## 📅 Bitácora de desarrollo

### 🟢 08/02/2026 – Inicio del proyecto
- Creación del repositorio Git
- Generación del proyecto con Spring Initializr
- Configuración del entorno de desarrollo
- Selección de tecnologías: Java 21, Spring Boot 3.3.5, MySQL 8, Maven
- Inclusión de dependencias base: Web, JPA, Security, Validation, WebSocket, MySQL Driver, Lombok

---

### 🟢 12/02/2026 – Módulo de Dispositivos + Primer Gemelo Digital
- CRUD completo de dispositivos (`/devices`)
- Relación 1:1 entre Device y DigitalTwin
- Creación automática del gemelo digital al registrar un dispositivo
- Inicialización del twin: `status: OFFLINE`, `telemetryJson: {}`, `lastUpdate: now`
- Arquitectura por capas (Controller → Service → Repository → Model)

---

### 🟢 Implementación de telemetría MQTT
- Integración con broker MQTT para ingesta de telemetría
- Validación de propiedades contra las definidas en el dispositivo
- Normalización del payload recibido
- Soporte de formato multi-dispositivo y carga desde YAML

---

### 🟢 Desarrollo del Frontend (React + Vite)
- Estructura base del frontend con Vite
- Interfaz de gestión de dispositivos (DeviceManager)
- Visualización de propiedades del twin y dispositivos
- Mejoras progresivas de UI y estilos CSS con tema oscuro

---

### 🟢 WebSocket en tiempo real
- Configuración de broker STOMP sobre SockJS (`/ws`)
- Tópicos: `/topic/twins` (telemetría), `/topic/unknown-devices`, `/topic/alerts`
- Actualización del estado del frontend sin necesidad de refetch
- Indicador visual de twins "en vivo" (4 segundos tras recibir datos)

---

### 🟢 Sincronización bidireccional Twin ↔ Dispositivo físico
- Cambios en el gemelo digital se reflejan en el dispositivo físico
- Registro de cambios de configuración en el historial de telemetría
- Modo mantenimiento: pausa la sincronización para un dispositivo

---

### 🟢 Dashboard de KPIs
- Panel con métricas clave: total dispositivos, twins, registros de telemetría, alertas activas
- Actualización en tiempo real al recibir datos por WebSocket
- Indicadores de tendencia y estado del sistema

---

### 🟢 Gestión de Usuarios
- CRUD de usuarios con roles ADMIN y USER
- Autenticación mediante JWT
- Panel de administración de cuentas (solo visible para ADMIN)

---

### 🟢 Exportación CSV y PDF
- Exportación del inventario completo de dispositivos
- PDF con tabla formateada usando jsPDF + AutoTable
- CSV para análisis en hojas de cálculo

---

### 🟢 Detección de Dispositivos Desconocidos
- El backend detecta telemetría de dispositivos no registrados
- Notificación automática en el frontend vía WebSocket (toast de advertencia)
- Opción de registrar el dispositivo desconocido directamente desde la alerta

---

### 🟢 Sistema de Alertas por Umbral
- Reglas configurables: selección de dispositivo, propiedad, operador y valor umbral
- Evaluación automática en cada ingesta de telemetría
- Notificación en tiempo real mediante WebSocket y toast en pantalla
- Dashboard con conteo de alertas activas

---

### 🟢 Despliegue en producción
- Configuración de variables de entorno para producción
- CORS configurado para frontend desplegado en Vercel
- Variables de conexión a base de datos externalizadas

---

### 🟢 Filtros avanzados en Gestión de Dispositivos
- Filtro por texto (código o nombre)
- Filtro por namespace
- Filtro por tipo de dispositivo
- Filtro por estado (ONLINE / OFFLINE / ERROR)
- **Filtro por tags** (etiquetas separadas por coma asignadas al dispositivo)
- Los mismos filtros disponibles en el modal "Ver todos" del Dashboard
- Botón "Limpiar" que resetea todos los filtros activos simultáneamente

---

### 🟢 29/04/2026 – Visualización del Grafo de Gemelos Digitales
- Integración de **React Flow** para visualización interactiva
- Nueva tab **"Grafo de Twins"** en el navbar de la aplicación
- Cada gemelo digital se representa como un nodo con:
  - Nombre del twin y código del dispositivo asociado
  - Tipo de dispositivo
  - Badge de estado con color (verde=ONLINE, rojo=ERROR, gris=OFFLINE)
  - Vista previa de hasta 3 valores de telemetría en tiempo real
- Nodos con datos activos pulsan en verde (sincronizado con WebSocket)
- Clic en cualquier nodo abre un **panel lateral de detalle** con:
  - Información completa del dispositivo (namespace, ubicación, tipo, estado)
  - Telemetría completa actual con todos los valores
  - Fecha y hora de última actualización
- Controles: zoom (+/-), ajuste a pantalla, minimapa navegable
- Nodos arrastrables para reorganizar la distribución visual
- Tab de **Gráficas** ocultada del navbar (código conservado para uso futuro)

---

## ⚙️ Instalación y configuración

### 1. Herramientas requeridas

Instalar las siguientes herramientas antes de ejecutar el proyecto:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|----------|
| Java JDK | 21 (LTS) | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org/download.cgi |
| Node.js + npm | 18+ | https://nodejs.org |
| MySQL Server | 8.x | https://dev.mysql.com/downloads/mysql |
| Git | cualquier | https://git-scm.com |

> **Nota:** El broker MQTT ya está configurado en la nube (HiveMQ Cloud). No se requiere instalar Mosquitto ni ningún broker local.

---

### 2. Clonar el repositorio

```bash
git clone <url-del-repo>
cd Proyecto-grado
```

---

### 3. Configuración del Backend

#### 3.1 Crear la base de datos en MySQL

```sql
CREATE DATABASE smartcampus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Las tablas se crean automáticamente al iniciar el backend (Hibernate `ddl-auto=update`).

#### 3.2 Configurar variables de entorno

El backend lee la conexión a MySQL desde variables de entorno. Definirlas antes de ejecutar:

**Linux / macOS:**
```bash
export DATABASE_URL=jdbc:mysql://localhost:3306/smartcampus
export DATABASE_USERNAME=root
export DATABASE_PASSWORD=tu_contraseña
```

**Windows (CMD):**
```cmd
set DATABASE_URL=jdbc:mysql://localhost:3306/smartcampus
set DATABASE_USERNAME=root
set DATABASE_PASSWORD=tu_contraseña
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="jdbc:mysql://localhost:3306/smartcampus"
$env:DATABASE_USERNAME="root"
$env:DATABASE_PASSWORD="tu_contraseña"
```

> El JWT secret y la configuración MQTT ya están incluidos en `application.properties` y no requieren configuración adicional para entorno local.

#### 3.3 Instalar dependencias y ejecutar el backend

```bash
cd backend/admin-module
mvn clean install
mvn spring-boot:run
```

El backend quedará disponible en: `http://localhost:8090/api`

La documentación Swagger estará en: `http://localhost:8090/api/swagger-ui.html`

---

### 4. Configuración del Frontend

#### 4.1 Instalar dependencias de Node.js

```bash
cd frontend/smartcampus-frontend
npm install
```

Este comando instala automáticamente todas las librerías del proyecto:

| Librería | Uso |
|----------|-----|
| `react` + `react-dom` | Framework UI |
| `axios` | Llamadas HTTP a la API REST |
| `reactflow` | Visualización del grafo de gemelos digitales |
| `@stomp/stompjs` + `sockjs-client` | WebSocket en tiempo real |
| `chart.js` | Gráficas de telemetría |
| `jspdf` + `jspdf-autotable` | Exportación de inventario a PDF |
| `js-yaml` | Carga masiva de dispositivos desde YAML |

#### 4.2 Configurar la URL del backend

Crear o editar el archivo `frontend/smartcampus-frontend/.env`:

```env
# Para desarrollo local (apunta al backend local)
VITE_API_URL=http://localhost:8090/api

# Para producción (Railway u otro servidor)
# VITE_API_URL=https://tu-backend.up.railway.app/api
```

> Si no se define `VITE_API_URL`, el frontend apunta automáticamente a `http://localhost:8090/api`.

#### 4.3 Ejecutar el frontend

```bash
npm run dev
```

Abrir en el navegador: `https://smartcampus-admin-module.vercel.app/`

---

### 5. Verificar que todo funciona

1. MySQL corriendo y base de datos `smartcampus` creada
2. Backend iniciado en `http://localhost:8090/api`
3. Frontend iniciado en `http://localhost:5173`
4. Ingresar con las credenciales de administrador
5. El Dashboard debe mostrar los datos y el WebSocket debe conectarse automáticamente

---

## 📂 Estructura del proyecto

```
Proyecto-grado/
├── backend/
│   └── admin-module/
│       └── src/main/java/com/uis/smartcampus/
│           ├── controller/   → Endpoints REST
│           ├── service/      → Lógica de negocio
│           ├── repository/   → Acceso a datos (JPA)
│           ├── model/        → Entidades (Device, DigitalTwin, etc.)
│           ├── dto/          → Objetos de transferencia
│           └── config/       → Security, WebSocket, MQTT
└── frontend/
    └── smartcampus-frontend/
        └── src/
            ├── components/   → Componentes React
            ├── services/     → Llamadas a API y WebSocket
            ├── api/          → Configuración de Axios
            └── App.jsx       → Orquestador principal
```

---

## 🎯 Estado del proyecto

- [✅] CRUD de dispositivos
- [✅] Gemelo digital automático por dispositivo
- [✅] Ingesta de telemetría vía MQTT
- [✅] WebSocket para monitoreo en vivo
- [✅] Dashboard de KPIs
- [✅] Gestión de propiedades
- [✅] Gestión de usuarios con JWT
- [✅] Sistema de alertas por umbral
- [✅] Exportación CSV y PDF
- [✅] Detección de dispositivos desconocidos
- [✅] Sincronización bidireccional twin ↔ dispositivo
- [✅] Modo mantenimiento
- [✅] Filtros avanzados con tags
- [✅] Visualización del grafo de gemelos digitales (React Flow)
- [  ] Relaciones explícitas entre gemelos digitales
- [  ] Asignación de dispositivos a usuarios específicos
- [  ] Pruebas unitarias e integración
