# SmartCampus UIS — Documentación Técnica del Proyecto

**Universidad Industrial de Santander**  
**Proyecto de Grado — Ingeniería de Sistemas**  
**Año:** 2026

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#3-tecnologías-utilizadas)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Módulo Backend](#5-módulo-backend)
   - [Modelos de Datos](#51-modelos-de-datos)
   - [Endpoints de la API](#52-endpoints-de-la-api)
   - [Servicios](#53-servicios)
   - [Seguridad y Autenticación](#54-seguridad-y-autenticación)
   - [Comunicación MQTT](#55-comunicación-mqtt)
   - [WebSocket](#56-websocket)
   - [Sistema de Alertas](#57-sistema-de-alertas)
6. [Módulo Frontend](#6-módulo-frontend)
   - [Componentes Principales](#61-componentes-principales)
   - [Servicios API](#62-servicios-api)
   - [Funcionalidades por Rol](#63-funcionalidades-por-rol)
7. [Funcionalidades Implementadas](#7-funcionalidades-implementadas)
8. [Configuración y Despliegue](#8-configuración-y-despliegue)
9. [Usuarios del Sistema](#9-usuarios-del-sistema)
10. [Documentación de la API (Swagger)](#10-documentación-de-la-api-swagger)

---

## 1. Descripción General

**SmartCampus UIS** es un sistema de gestión de dispositivos IoT para el campus universitario de la Universidad Industrial de Santander. Permite monitorear en tiempo real el estado de sensores y actuadores distribuidos en el campus, gestionando su telemetría mediante el concepto de **Digital Twins** (Gemelos Digitales).

### Objetivos del sistema

- Registrar y gestionar dispositivos IoT del campus (sensores de temperatura, humedad, batería, entre otros)
- Mantener un Digital Twin actualizado por cada dispositivo físico
- Recibir telemetría en tiempo real a través del protocolo MQTT
- Enviar alertas automáticas por correo electrónico cuando se superen umbrales configurables
- Mostrar notificaciones visuales en la interfaz web
- Permitir la gestión de usuarios con control de acceso por roles
- Proveer un panel de analítica con exportación de datos en CSV y PDF

---

## 2. Arquitectura del Sistema

```
┌─────────────────┐        MQTT         ┌──────────────────────┐
│  Dispositivos   │ ──────────────────► │                      │
│  IoT (RPi, etc) │                     │   Backend             │
└─────────────────┘                     │   Spring Boot         │
                                        │   (Railway)           │
┌─────────────────┐        MQTT         │                      │
│   Node-RED      │ ◄────────────────── │   - REST API          │
│  (Broker/Relay) │ ──────────────────► │   - MQTT Listener     │
└─────────────────┘    Confirmación     │   - WebSocket STOMP   │
                                        │   - Digital Twins     │
                                        │   - Alertas Email     │
                                        └──────────┬───────────┘
                                                   │
                                         REST + WebSocket
                                                   │
                                        ┌──────────▼───────────┐
                                        │   Frontend            │
                                        │   React + Vite        │
                                        │   (Vercel)            │
                                        └──────────────────────┘
```

### Flujo de telemetría

1. El dispositivo IoT publica datos en el topic MQTT `smartcampus/telemetry`
2. El backend recibe el mensaje, valida las propiedades y guarda el historial
3. El backend publica un ACK en `smartcampus/ack` hacia Node-RED
4. Node-RED confirma el procesamiento publicando en `smartcampus/confirm`
5. El backend actualiza el Digital Twin con los datos confirmados
6. El backend notifica al frontend via WebSocket (`/topic/twins`)
7. El frontend actualiza la pantalla en tiempo real sin recargar

---

## 3. Tecnologías Utilizadas

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Java | 21 | Lenguaje principal |
| Spring Boot | 3.3.5 | Framework principal |
| Spring Security | 3.3.5 | Autenticación y autorización |
| Spring Integration MQTT | 3.3.5 | Comunicación con broker MQTT |
| Spring WebSocket (STOMP) | 3.3.5 | Tiempo real frontend-backend |
| Spring Mail | 3.3.5 | Envío de alertas por correo |
| Spring Data JPA | 3.3.5 | Persistencia de datos |
| MySQL | 8.x | Base de datos relacional |
| JJWT | 0.11.5 | Generación y validación de tokens JWT |
| Eclipse Paho MQTT | 1.2.5 | Cliente MQTT |
| Lombok | latest | Reducción de código boilerplate |
| SpringDoc OpenAPI | 2.6.0 | Documentación Swagger |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.x | Framework UI |
| Vite | 5.x | Bundler y servidor de desarrollo |
| Axios | latest | Peticiones HTTP a la API |
| @stomp/stompjs | latest | Cliente WebSocket STOMP |
| sockjs-client | latest | Fallback WebSocket |
| jsPDF | latest | Generación de reportes PDF |
| jspdf-autotable | latest | Tablas en PDF |
| Chart.js | latest | Gráficas de telemetría |

### Infraestructura
| Servicio | Uso |
|---|---|
| Railway | Despliegue del backend Spring Boot |
| Vercel | Despliegue del frontend React |
| HiveMQ Cloud | Broker MQTT (SSL, puerto 8883) |
| MySQL (Railway) | Base de datos en producción |
| Gmail SMTP | Envío de correos de alerta |

---

## 4. Estructura del Proyecto

```
Proyecto-grado/
├── backend/
│   └── admin-module/
│       ├── src/main/java/com/uis/smartcampus/admin_module/
│       │   ├── config/
│       │   │   ├── CorsConfig.java
│       │   │   ├── DataInitializer.java
│       │   │   ├── MqttConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   ├── SwaggerConfig.java
│       │   │   └── WebSocketConfig.java
│       │   ├── controller/
│       │   │   ├── AlertRuleController.java
│       │   │   ├── AuthController.java
│       │   │   ├── DeviceController.java
│       │   │   ├── DigitalTwinController.java
│       │   │   ├── PropertyController.java
│       │   │   └── TelemetryController.java
│       │   ├── model/
│       │   │   ├── AlertRule.java
│       │   │   ├── AppUser.java
│       │   │   ├── Device.java
│       │   │   ├── DigitalTwin.java
│       │   │   ├── Property.java
│       │   │   ├── Role.java
│       │   │   ├── TelemetryRecord.java
│       │   │   └── TwinUpdateMessage.java
│       │   ├── repository/
│       │   │   ├── AlertRuleRepository.java
│       │   │   ├── AppUserRepository.java
│       │   │   ├── DeviceRepository.java
│       │   │   ├── DigitalTwinRepository.java
│       │   │   ├── PropertyRepository.java
│       │   │   └── TelemetryRecordRepository.java
│       │   ├── security/
│       │   │   ├── JwtFilter.java
│       │   │   └── JwtUtil.java
│       │   └── service/
│       │       ├── AlertService.java
│       │       ├── DeviceService.java
│       │       ├── DeviceStatusScheduler.java
│       │       ├── DigitalTwinService.java
│       │       ├── MqttConfirmListener.java
│       │       ├── MqttPublisherService.java
│       │       ├── MqttTelemetryListener.java
│       │       └── TelemetryService.java
│       └── src/main/resources/
│           └── application.properties
│
└── frontend/
    └── smartcampus-frontend/
        └── src/
            ├── api/
            │   └── api.js
            ├── components/
            │   ├── AlertRulesManager.jsx
            │   ├── AnalyticsPanel.jsx
            │   ├── DataCard.jsx
            │   ├── DeviceManager.jsx
            │   ├── LoginPage.jsx
            │   ├── PropertyManager.jsx
            │   ├── Tabs.jsx
            │   ├── TelemetryCharts.jsx
            │   └── ToastAlert.jsx
            └── services/
                ├── alertRuleService.js
                ├── deviceService.js
                ├── propertyService.js
                ├── telemetryService.js
                ├── twinService.js
                └── useTwinWebSocket.js
```

---

## 5. Módulo Backend

### 5.1 Modelos de Datos

#### Device
Representa un dispositivo IoT registrado en el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| code | String | Código único del dispositivo (ej: RPI-001) |
| name | String | Nombre descriptivo |
| type | String | Tipo: SENSOR, ACTUATOR, CAMERA, CONTROLLER |
| status | String | Estado: ONLINE, OFFLINE, WARNING, LOW_BATTERY |
| location | String | Ubicación física |
| namespace | String | Agrupación lógica (ej: edificio-a/piso-2) |
| tags | String | Etiquetas separadas por coma |
| lastSeen | LocalDateTime | Última vez que envió telemetría |
| properties | Set\<Property\> | Propiedades asociadas |

#### DigitalTwin
Gemelo digital de un dispositivo. Mantiene el estado actual del dispositivo.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| device | Device | Dispositivo físico asociado |
| telemetryJson | String | JSON con los últimos valores de cada propiedad |
| lastUpdate | LocalDateTime | Última actualización del twin |

#### Property
Define una propiedad medible (ej: temperatura, humedad).

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| name | String | Nombre de la propiedad (ej: temperature) |
| unit | String | Unidad de medida (ej: °C, %) |
| description | String | Descripción |
| writable | Boolean | Si puede ser modificada externamente |

#### TelemetryRecord
Registro histórico de cada dato enviado por un dispositivo.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| device | Device | Dispositivo que generó el dato |
| telemetryJson | String | JSON con los valores en ese instante |
| timestamp | LocalDateTime | Fecha y hora del registro |

#### AlertRule
Regla de alerta configurable desde la interfaz.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| property | String | Propiedad a evaluar (ej: temperature) |
| operator | String | GREATER_THAN o LESS_THAN |
| threshold | Double | Valor umbral |
| label | String | Etiqueta descriptiva |
| active | Boolean | Si la regla está activa |

#### AppUser
Usuario del sistema con rol asignado.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| username | String | Nombre de usuario único |
| password | String | Contraseña encriptada con BCrypt |
| role | Role | ADMIN o VIEWER |

---

### 5.2 Endpoints de la API

**URL base:** `https://smartcampus-admin-module-production.up.railway.app/api`

#### Autenticación
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| POST | `/auth/login` | Iniciar sesión, retorna JWT | Público |

**Body de login:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
**Respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "admin",
  "role": "ADMIN"
}
```

#### Dispositivos
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/devices` | Listar todos los dispositivos | ADMIN, VIEWER |
| GET | `/devices/{id}` | Obtener dispositivo por ID | ADMIN, VIEWER |
| POST | `/devices` | Crear dispositivo | ADMIN |
| PUT | `/devices/{id}` | Actualizar dispositivo | ADMIN |
| DELETE | `/devices/{id}` | Eliminar dispositivo | ADMIN |
| POST | `/devices/{id}/components` | Asignar propiedades | ADMIN |
| POST | `/devices/{id}/property-value` | Actualizar valor de propiedad | ADMIN |

#### Propiedades
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/properties` | Listar todas las propiedades | ADMIN, VIEWER |
| GET | `/properties/{id}` | Obtener propiedad por ID | ADMIN, VIEWER |
| POST | `/properties` | Crear propiedad | ADMIN |
| PUT | `/properties/{id}` | Actualizar propiedad | ADMIN |
| DELETE | `/properties/{id}` | Eliminar propiedad | ADMIN |

#### Telemetría
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/telemetry` | Listar todo el historial | ADMIN, VIEWER |
| GET | `/telemetry/device/{deviceId}` | Historial por dispositivo | ADMIN, VIEWER |
| GET | `/telemetry/history/{code}` | Historial por código de dispositivo | ADMIN, VIEWER |
| POST | `/telemetry/{code}` | Enviar telemetría manual | ADMIN |

#### Digital Twins
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/twins` | Listar todos los twins | ADMIN, VIEWER |

#### Reglas de Alerta
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/alert-rules` | Listar todas las reglas | ADMIN |
| POST | `/alert-rules` | Crear regla | ADMIN |
| PUT | `/alert-rules/{id}` | Actualizar regla | ADMIN |
| DELETE | `/alert-rules/{id}` | Eliminar regla | ADMIN |

---

### 5.3 Servicios

#### TelemetryService
Procesa la telemetría recibida por MQTT:
1. Valida que las propiedades existan para el dispositivo
2. Actualiza el estado del dispositivo (ONLINE, WARNING, LOW_BATTERY, OFFLINE)
3. Verifica umbrales y dispara alertas via `AlertService`
4. Guarda el registro histórico en `TelemetryRecord`
5. Publica ACK via MQTT hacia Node-RED
6. Cuando recibe confirmación, actualiza el Digital Twin y notifica al frontend via WebSocket

#### AlertService
Gestiona el envío de alertas:
- Lee las reglas activas desde la base de datos en cada evaluación
- Evalúa operadores `GREATER_THAN` y `LESS_THAN`
- Implementa un cooldown configurable (por defecto 30 minutos) para evitar spam de correos
- Envía correo via Gmail SMTP cuando se cumple una regla

#### DeviceStatusScheduler
Tarea programada que marca como OFFLINE los dispositivos que no han enviado telemetría en un tiempo determinado.

---

### 5.4 Seguridad y Autenticación

El sistema usa **JWT (JSON Web Tokens)** con Spring Security en modo stateless.

#### Flujo de autenticación
1. El usuario envía `POST /auth/login` con sus credenciales
2. El backend valida contra la tabla `app_users` con BCrypt
3. Si es válido, genera un JWT firmado con HS256 (duración: 24 horas)
4. El frontend almacena el token en `localStorage`
5. Cada petición incluye el header: `Authorization: Bearer <token>`
6. `JwtFilter` intercepta todas las peticiones y valida el token

#### Roles
| Rol | Permisos |
|---|---|
| ADMIN | Acceso completo: leer, crear, editar, eliminar, gestionar alertas |
| VIEWER | Solo lectura: ver dispositivos, twins, telemetría y gráficas |

---

### 5.5 Comunicación MQTT

**Broker:** HiveMQ Cloud  
**Puerto:** 8883 (SSL)  
**Protocolo:** MQTT v3.1.1

| Topic | Dirección | Descripción |
|---|---|---|
| `smartcampus/telemetry` | Dispositivo → Backend | Datos de telemetría |
| `smartcampus/ack` | Backend → Node-RED | Confirmación de recepción |
| `smartcampus/confirm` | Node-RED → Backend | Confirmación de procesamiento |

**Formato del payload de telemetría:**
```json
{
  "deviceCode": "RPI-001",
  "temperature": 45.2,
  "battery_level": 78,
  "humidity": 60.1,
  "cpu_usage": 35
}
```

---

### 5.6 WebSocket

El sistema usa **STOMP sobre SockJS** para comunicación en tiempo real.

**Endpoint de conexión:** `/api/ws`  
**Topic de suscripción:** `/topic/twins`

Cada vez que el Digital Twin de un dispositivo se actualiza, el backend publica un mensaje con la siguiente estructura:

```json
{
  "deviceCode": "RPI-001",
  "twinId": 3,
  "telemetryJson": "{\"temperature\":45.2,\"battery_level\":78}",
  "lastUpdate": "2026-04-19T18:06:58"
}
```

El frontend actualiza el estado del twin en tiempo real y muestra el badge **"En vivo"** durante 4 segundos.

---

### 5.7 Sistema de Alertas

#### Alertas por correo
- Remitente: `smartcampus.uis@gmail.com`
- Destinatario: configurable en `application.properties`
- Cooldown: 30 minutos por dispositivo por regla (evita spam)

#### Reglas por defecto (creadas al iniciar)
| Propiedad | Operador | Umbral | Etiqueta |
|---|---|---|---|
| temperature | GREATER_THAN | 80.0 | Temperatura crítica |
| battery_level | LESS_THAN | 10.0 | Batería baja |

#### Notificaciones en la app
El frontend detecta umbrales en los datos más recientes de cada dispositivo y muestra toasts:
- **Rojo** — Temperatura crítica (> 80°C)
- **Naranja** — Batería baja (< 10%)

Los toasts se auto-cierran a los 7 segundos y no se repiten mientras el valor siga en alerta.

---

## 6. Módulo Frontend

### 6.1 Componentes Principales

| Componente | Descripción |
|---|---|
| `LoginPage` | Pantalla de inicio de sesión con manejo de errores |
| `DataCard` | Tarjeta del dashboard para dispositivos, twins y telemetría |
| `DeviceManager` | Gestión completa de dispositivos (CRUD, clonación, importación YAML) |
| `PropertyManager` | Gestión de propiedades de sensores |
| `TelemetryCharts` | Gráficas de temperatura, batería y humedad con Chart.js |
| `AnalyticsPanel` | Panel de analítica con estadísticas y exportación CSV/PDF |
| `AlertRulesManager` | Gestión de reglas de alerta (solo ADMIN) |
| `ToastAlert` | Notificaciones visuales de alertas en tiempo real |
| `Tabs` | Navegación por pestañas del dashboard |

### 6.2 Servicios API

| Archivo | Descripción |
|---|---|
| `api.js` | Instancia de Axios con interceptores de JWT y manejo de 401 |
| `deviceService.js` | CRUD de dispositivos |
| `propertyService.js` | CRUD de propiedades |
| `telemetryService.js` | Consulta de historial de telemetría |
| `twinService.js` | Consulta de Digital Twins |
| `alertRuleService.js` | CRUD de reglas de alerta |
| `useTwinWebSocket.js` | Hook React para conexión WebSocket en tiempo real |

### 6.3 Funcionalidades por Rol

| Funcionalidad | ADMIN | VIEWER |
|---|---|---|
| Ver dashboard | ✅ | ✅ |
| Ver dispositivos | ✅ | ✅ |
| Crear / editar / eliminar dispositivos | ✅ | ❌ |
| Ver propiedades | ✅ | ✅ |
| Crear / editar / eliminar propiedades | ✅ | ❌ |
| Ver telemetría y gráficas | ✅ | ✅ |
| Ver Digital Twins en tiempo real | ✅ | ✅ |
| Panel de analítica y exportación | ✅ | ✅ |
| Gestionar reglas de alerta | ✅ | ❌ |
| Ver pestaña Alertas | ✅ | ❌ |

---

## 7. Funcionalidades Implementadas

### 1. Gestión de dispositivos IoT
Registro completo de dispositivos con código, nombre, tipo, ubicación, namespace y etiquetas. Soporta importación masiva desde archivos YAML. Vista en tarjetas o lista con filtros por tipo, estado y namespace.

### 2. Digital Twins
Cada dispositivo tiene un gemelo digital que refleja su estado actual. El twin se actualiza automáticamente al recibir telemetría confirmada por Node-RED.

### 3. Monitoreo de telemetría en tiempo real
Recepción de datos via MQTT con actualización del Digital Twin en tiempo real via WebSocket. El frontend muestra el badge "En vivo" cuando llegan datos nuevos.

### 4. Sistema de alertas automáticas
Alertas configurables por umbral desde la interfaz. Envío de correo electrónico con cooldown de 30 minutos y notificaciones visuales (toasts) en la app.

### 5. Autenticación JWT y control de acceso
Login con JWT de 24 horas. Dos roles: ADMIN (acceso total) y VIEWER (solo lectura). Los botones de escritura se ocultan automáticamente al VIEWER.

### 6. Gráficas históricas
Gráficas de temperatura, humedad y batería con Chart.js. Filtro por dispositivo y selección de últimos 20, 50 o 100 registros.

### 7. Panel de analítica y exportación
Estadísticas por dispositivo y propiedad (mínimo, promedio, máximo, cantidad de registros). Filtros por dispositivo y rango de fechas. Exportación a CSV y PDF.

### 8. Documentación de la API
Swagger UI disponible en `/api/swagger-ui.html` con soporte para autenticación JWT integrada.

---

## 8. Configuración y Despliegue

### Variables de entorno — Backend (Railway)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a MySQL |
| `DATABASE_USERNAME` | Usuario de la base de datos |
| `DATABASE_PASSWORD` | Contraseña de la base de datos |
| `PORT` | Puerto del servidor (por defecto 8090) |

### Variables de entorno — Frontend (Vercel)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend (ej: `https://smartcampus-admin-module-production.up.railway.app/api`) |

### Configuración del backend (`application.properties`)

```properties
# Servidor
server.port=8090
server.servlet.context-path=/api

# Base de datos
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}

# JWT
jwt.secret=smartcampus-uis-proyecto-grado-secret-key-2026-muy-larga
jwt.expiration-ms=86400000

# Correo (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=smartcampus.uis@gmail.com
spring.mail.password=<app-password>

# Alertas
alert.mail.recipient=smartcampus.uis@gmail.com
alert.cooldown.minutes=30
```

---

## 9. Usuarios del Sistema

Los siguientes usuarios se crean automáticamente al iniciar la aplicación si no existen:

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Acceso total al sistema |
| `viewer` | `viewer123` | VIEWER | Solo lectura |

> **Nota:** Se recomienda cambiar las contraseñas por defecto antes de llevar el sistema a producción.

---

## 10. Documentación de la API (Swagger)

La documentación interactiva de la API está disponible en:

```
https://smartcampus-admin-module-production.up.railway.app/api/swagger-ui.html
```

Desde esta interfaz se puede:
- Ver todos los endpoints disponibles organizados por controlador
- Probar cada endpoint directamente desde el navegador
- Autenticarse con el token JWT usando el botón **Authorize**
- Ver los modelos de datos de request y response

Para autenticarse en Swagger:
1. Hacer `POST /auth/login` con las credenciales
2. Copiar el `token` de la respuesta
3. Hacer clic en **Authorize** e ingresar: `Bearer <token>`

---
*SmartCampus UIS — Proyecto de Grado*
