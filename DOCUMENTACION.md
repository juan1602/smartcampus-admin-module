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
- Sincronización bidireccional: aplicar cambios de configuración desde la interfaz hacia el dispositivo físico
- Configurar reglas de alerta por umbral y recibir notificaciones visuales en tiempo real
- Mostrar notificaciones emergentes (toasts) cuando se superen los umbrales definidos
- Permitir la gestión de usuarios con control de acceso por roles
- Proveer un panel de KPIs y analítica con exportación de datos en CSV y PDF
- Detectar y gestionar dispositivos desconocidos que envíen telemetría sin estar registrados
- Poner dispositivos en modo mantenimiento sin eliminarlos del sistema

---

## 2. Arquitectura del Sistema

```
┌─────────────────┐        MQTT         ┌──────────────────────┐
│  Dispositivos   │ ──────────────────► │                      │
│  IoT (RPi, etc) │ ◄────────────────── │   Backend             │
└─────────────────┘   Config via MQTT   │   Spring Boot         │
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

### Flujo de telemetría (dispositivo → plataforma)

1. El dispositivo IoT publica datos en el topic MQTT `smartcampus/telemetry`
2. El backend recibe el mensaje y valida si el dispositivo está registrado
   - Si **no está registrado**: guarda un `UnknownDeviceEvent` y notifica al frontend via WebSocket
   - Si **está registrado**: valida propiedades, guarda historial y actualiza estado
3. El backend publica un ACK en `smartcampus/ack` hacia Node-RED
4. Node-RED confirma el procesamiento publicando en `smartcampus/confirm`
5. El backend actualiza el Digital Twin con los datos confirmados
6. El backend notifica al frontend via WebSocket (`/topic/twins`)
7. El frontend actualiza la pantalla en tiempo real sin recargar

### Flujo de configuración (plataforma → dispositivo)

1. El admin modifica un valor editable desde el modal de información del dispositivo
2. El backend actualiza el Digital Twin en la BD y guarda un `TelemetryRecord`
3. El backend publica el cambio en `smartcampus/ack` con el nuevo valor
4. Node-RED reenvía a `smartcampus/confirm`
5. El dispositivo físico (suscrito a `smartcampus/confirm`) recibe y aplica el cambio

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
| js-yaml | latest | Importación de dispositivos desde YAML |

### Infraestructura
| Servicio | Uso |
|---|---|
| Railway | Despliegue del backend Spring Boot + base de datos MySQL |
| Vercel | Despliegue del frontend React |
| HiveMQ Cloud | Broker MQTT (SSL, puerto 8883) |
| Node-RED | Relay MQTT: recibe en `smartcampus/ack` y publica en `smartcampus/confirm` |

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
│       │   │   ├── TelemetryController.java
│       │   │   ├── UnknownDeviceController.java
│       │   │   └── UserController.java
│       │   ├── model/
│       │   │   ├── AlertRule.java
│       │   │   ├── AppUser.java
│       │   │   ├── Device.java
│       │   │   ├── DigitalTwin.java
│       │   │   ├── Property.java
│       │   │   ├── Role.java
│       │   │   ├── TelemetryRecord.java
│       │   │   ├── TwinUpdateMessage.java
│       │   │   ├── UnknownDeviceEvent.java
│       │   │   └── UserResponse.java
│       │   ├── repository/
│       │   │   ├── AlertRuleRepository.java
│       │   │   ├── AppUserRepository.java
│       │   │   ├── DeviceRepository.java
│       │   │   ├── DigitalTwinRepository.java
│       │   │   ├── PropertyRepository.java
│       │   │   ├── TelemetryRecordRepository.java
│       │   │   └── UnknownDeviceEventRepository.java
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
            │   ├── KpiDashboard.jsx
            │   ├── LoginPage.jsx
            │   ├── PropertyManager.jsx
            │   ├── Tabs.jsx
            │   ├── TelemetryCharts.jsx
            │   ├── ToastAlert.jsx
            │   ├── UnknownDevicesAlert.jsx
            │   └── UserManager.jsx
            └── services/
                ├── alertRuleService.js
                ├── deviceService.js
                ├── kpiService.js
                ├── propertyService.js
                ├── telemetryService.js
                ├── twinService.js
                ├── unknownDeviceService.js
                ├── userService.js
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
| status | String | Estado: ONLINE, OFFLINE, ERROR, WARNING, LOW_BATTERY, MAINTENANCE |
| location | String | Ubicación física |
| namespace | String | Agrupación lógica (ej: edificio-a/piso-2) |
| tags | String | Etiquetas separadas por coma |
| configJson | String | JSON con configuración flexible del dispositivo |
| lastSeen | LocalDateTime | Última vez que envió telemetría |
| properties | Set\<Property\> | Propiedades asociadas |

#### DigitalTwin
Gemelo digital de un dispositivo. Mantiene el estado actual del dispositivo en tiempo real.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| device | Device | Dispositivo físico asociado (relación 1-1) |
| telemetryJson | String | JSON con los últimos valores de cada propiedad |
| lastUpdate | LocalDateTime | Última actualización del twin |

#### Property
Define una propiedad medible o configurable (ej: temperatura, humedad, led_status).

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| name | String | Nombre de la propiedad (ej: temperature) |
| unit | String | Unidad de medida (ej: °C, %) |
| description | String | Descripción |
| writable | Boolean | Si puede ser modificada desde la interfaz (sync bidireccional) |

#### TelemetryRecord
Registro histórico de cada dato enviado por un dispositivo o modificado desde la interfaz.

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

#### UnknownDeviceEvent
Registro de telemetría recibida de dispositivos no registrados en el sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | Long | Identificador único |
| deviceCode | String | Código del dispositivo desconocido |
| telemetryJson | String | Payload recibido |
| receivedAt | LocalDateTime | Fecha y hora de recepción |
| ignored | Boolean | Si el admin decidió ignorarlo |

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
| GET | `/devices/stats` | Métricas agregadas de la flota | ADMIN, VIEWER |
| GET | `/devices/{id}` | Obtener dispositivo por ID | ADMIN, VIEWER |
| POST | `/devices` | Crear dispositivo | ADMIN |
| PUT | `/devices/{id}` | Actualizar dispositivo | ADMIN |
| DELETE | `/devices/{id}` | Eliminar dispositivo | ADMIN |
| POST | `/devices/{id}/components` | Asignar propiedades al dispositivo | ADMIN |
| POST | `/devices/{id}/property-value` | Actualizar valor de propiedad editable (sincroniza con dispositivo físico vía MQTT) | ADMIN |
| POST | `/devices/{id}/maintenance` | Alternar modo mantenimiento (MAINTENANCE ↔ OFFLINE) | ADMIN |

**Respuesta de `/devices/stats`:**
```json
{
  "totalDevices": 3,
  "activeCount": 2,
  "onlineCount": 1,
  "lowBatteryCount": 1,
  "warningCount": 0,
  "offlineCount": 1,
  "errorCount": 0,
  "maintenanceCount": 0,
  "totalTwins": 3,
  "totalProperties": 5,
  "lastSeenDevice": {
    "name": "RPi Lab",
    "code": "RPI-001",
    "lastSeen": "2026-04-19T15:58:33",
    "status": "LOW_BATTERY"
  },
  "byType": { "SENSOR": 2, "ACTUATOR": 1 },
  "byNamespace": { "laboratorio": 2, "pasillo": 1 }
}
```
> `activeCount` = ONLINE + LOW_BATTERY + WARNING (dispositivos que están enviando datos activamente)

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
| GET | `/telemetry/device/{deviceId}` | Historial por ID de dispositivo | ADMIN, VIEWER |
| GET | `/telemetry/history/{code}` | Historial por código de dispositivo | ADMIN, VIEWER |

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

#### Usuarios
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/users` | Listar todos los usuarios (sin contraseña) | ADMIN |
| POST | `/users` | Crear usuario | ADMIN |
| PUT | `/users/{id}` | Actualizar usuario (contraseña opcional) | ADMIN |
| DELETE | `/users/{id}` | Eliminar usuario (no puede eliminarse a sí mismo) | ADMIN |

#### Dispositivos Desconocidos
| Método | Endpoint | Descripción | Acceso |
|---|---|---|---|
| GET | `/unknown-devices` | Listar eventos pendientes | ADMIN |
| POST | `/unknown-devices/{id}/ignore` | Marcar evento como ignorado | ADMIN |

---

### 5.3 Servicios

#### TelemetryService
Procesa la telemetría recibida por MQTT:
1. Si el dispositivo **no está registrado**: guarda `UnknownDeviceEvent` y notifica al frontend via WebSocket `/topic/unknown-devices`. Solo guarda un evento si no hay uno pendiente para ese código.
2. Si el dispositivo **está en MAINTENANCE**: actualiza `lastSeen` pero no modifica su estado
3. Filtra propiedades recibidas contra las propiedades válidas del dispositivo
4. Actualiza el estado según nivel de batería: ONLINE, WARNING (<5%), LOW_BATTERY (<20%), OFFLINE (0%)
5. Verifica umbrales y dispara alertas via `AlertService`
6. Publica ACK via MQTT hacia Node-RED
7. Al recibir confirmación en `smartcampus/confirm`, actualiza el Digital Twin y notifica al frontend via WebSocket `/topic/twins`

#### DeviceService
Gestiona el ciclo de vida de los dispositivos:
- Crea automáticamente un Digital Twin al registrar un nuevo dispositivo
- `updatePropertyValue`: valida que la propiedad sea editable, actualiza el twin en BD, guarda `TelemetryRecord` para trazabilidad y publica el cambio en `smartcampus/ack` para propagarlo al dispositivo físico
- `toggleMaintenance`: alterna el estado entre `MAINTENANCE` y `OFFLINE`
- `getStats`: retorna métricas agregadas de la flota (totales, estados, último visto, distribución por tipo y namespace)

#### AlertService
Gestiona las notificaciones de alerta via WebSocket:
- Lee las reglas activas desde la BD en cada evaluación
- Evalúa operadores `GREATER_THAN` y `LESS_THAN`
- Cooldown de 2 minutos por dispositivo por regla (en memoria) para evitar notificaciones repetitivas
- Cuando se cumple una regla, publica el evento en `/topic/alerts` via WebSocket para que el frontend muestre un toast en tiempo real

#### DeviceStatusScheduler
Tarea programada (cada 30 segundos) que marca como OFFLINE los dispositivos cuyo `lastSeen` supere los 10 minutos. **Omite dispositivos en estado MAINTENANCE.**

#### MqttPublisherService
Publica mensajes en el broker MQTT:
- `publishAck(deviceCode, data)`: publica en `smartcampus/ack` con QoS 1. Usado tanto para ACKs de telemetría como para propagar cambios de configuración desde la interfaz.

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
7. Si el token es inválido o expiró, el interceptor de Axios redirige al login automáticamente

#### Roles
| Rol | Permisos |
|---|---|
| ADMIN | Acceso completo: leer, crear, editar, eliminar, gestionar alertas, gestionar usuarios, ver y gestionar dispositivos desconocidos, modo mantenimiento |
| VIEWER | Solo lectura: ver dispositivos, twins, telemetría, gráficas, KPIs y analítica |

---

### 5.5 Comunicación MQTT

**Broker:** HiveMQ Cloud  
**Puerto:** 8883 (SSL)  
**Protocolo:** MQTT v3.1.1

| Topic | Dirección | Descripción |
|---|---|---|
| `smartcampus/telemetry` | Dispositivo → Backend | Datos de telemetría y detección de dispositivos desconocidos |
| `smartcampus/ack` | Backend → Node-RED | ACK de telemetría + cambios de configuración desde la UI |
| `smartcampus/confirm` | Node-RED → Backend + Dispositivo | Confirmación de procesamiento y entrega de configuración al dispositivo |

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

**Formato del payload de ACK (telemetría y configuración):**
```json
{
  "deviceCode": "RPI-001",
  "data": {
    "temperature": 45.2,
    "battery_level": 78
  }
}
```

---

### 5.6 WebSocket

El sistema usa **STOMP sobre SockJS** para comunicación en tiempo real.

**Endpoint de conexión:** `/api/ws`

| Topic | Evento | Payload |
|---|---|---|
| `/topic/twins` | Actualización de Digital Twin | `{ deviceCode, twinId, telemetryJson, lastUpdate }` |
| `/topic/alerts` | Alerta de umbral disparada | `{ deviceCode, property, value, threshold, operator, label }` |
| `/topic/unknown-devices` | Telemetría de dispositivo no registrado detectada | `{ deviceCode, telemetryJson }` |

El frontend se suscribe a los tres topics al conectarse:
- `/topic/twins` → actualiza el twin en pantalla y muestra badge "En vivo" durante 4 segundos
- `/topic/alerts` → muestra toast con el detalle de la alerta (dispositivo, propiedad, valor, umbral)
- `/topic/unknown-devices` → muestra toast de advertencia y recarga el banner de dispositivos desconocidos en la pestaña Dispositivos

---

### 5.7 Sistema de Alertas

Las alertas funcionan completamente via WebSocket — no requieren correo electrónico.

#### Flujo de una alerta
1. Al procesar telemetría, `TelemetryService` llama a `AlertService.checkAndAlert(deviceCode, data)`
2. `AlertService` consulta las reglas activas desde la BD
3. Evalúa cada regla contra los datos recibidos
4. Si se cumple la condición y no está en cooldown, publica en `/topic/alerts` via WebSocket
5. El frontend recibe el mensaje y muestra un toast en pantalla

#### Cooldown
- 2 minutos por dispositivo por regla (almacenado en memoria del servidor)
- Se resetea al reiniciar el backend

#### Reglas creadas por defecto al iniciar (`DataInitializer`)
Solo se insertan si la tabla `alert_rules` está vacía.

| Propiedad | Operador | Umbral | Etiqueta |
|---|---|---|---|
| temperature | GREATER_THAN | 80.0 | Temperatura crítica (>80°C) |
| battery_level | LESS_THAN | 10.0 | Batería baja (<10%) |

#### Notificaciones toast en el frontend
| Tipo | Icono | Condición |
|---|---|---|
| Alerta de umbral | 🔔 | Regla configurada disparada (backend) |
| Dispositivo desconocido | ⚠️ | Llega telemetría de código no registrado |

Los toasts se auto-cierran a los 7 segundos.

---

## 6. Módulo Frontend

### 6.1 Componentes Principales

| Componente | Descripción |
|---|---|
| `LoginPage` | Pantalla de inicio de sesión con manejo de errores |
| `KpiDashboard` | Panel de métricas de la flota: totales, estados, último visto, distribución por tipo y namespace. Auto-refresco cada 30s y reactivo a WebSocket |
| `DataCard` | Tarjeta del dashboard para dispositivos, twins y telemetría. Muestra badge "En vivo" cuando llega telemetría por WebSocket |
| `DeviceManager` | Gestión completa de dispositivos: CRUD, clonación, importación YAML, filtros, vista tarjeta/lista, modo mantenimiento, exportación CSV/PDF, alerta de desconocidos |
| `UnknownDevicesAlert` | Banner dentro de Dispositivos que muestra eventos de dispositivos no registrados con opciones "Crear dispositivo" e "Ignorar" |
| `PropertyManager` | Gestión de propiedades del catálogo: CRUD con indicador writable/readonly |
| `TelemetryCharts` | Gráficas de temperatura, batería y humedad con Chart.js. Filtro por dispositivo y cantidad de registros |
| `AnalyticsPanel` | Estadísticas por dispositivo (mín, máx, promedio, cantidad). Filtros por dispositivo y rango de fechas. Exportación CSV y PDF |
| `AlertRulesManager` | Gestión de reglas de alerta: CRUD y toggle activo/inactivo. Solo ADMIN |
| `UserManager` | Gestión de usuarios: CRUD, badge "Tú", protección contra auto-eliminación. Solo ADMIN |
| `ToastAlert` | Notificaciones visuales en la esquina superior derecha |
| `Tabs` | Navegación por pestañas del dashboard |

### 6.2 Servicios API

| Archivo | Descripción |
|---|---|
| `api.js` | Instancia de Axios con interceptor JWT en request y redirección al login en 401 |
| `deviceService.js` | CRUD de dispositivos, asignación de propiedades, actualización de valores, modo mantenimiento |
| `propertyService.js` | CRUD de propiedades |
| `telemetryService.js` | Consulta de historial completo y por dispositivo |
| `twinService.js` | Consulta de Digital Twins |
| `alertRuleService.js` | CRUD de reglas de alerta |
| `userService.js` | CRUD de usuarios |
| `kpiService.js` | Métricas agregadas de la flota (`GET /devices/stats`) |
| `unknownDeviceService.js` | Consulta e ignorar dispositivos desconocidos |
| `useTwinWebSocket.js` | Hook React: conecta via SockJS+STOMP, suscribe a `/topic/twins`, `/topic/alerts` y `/topic/unknown-devices` |

### 6.3 Funcionalidades por Rol

| Funcionalidad | ADMIN | VIEWER |
|---|---|---|
| Ver dashboard con KPIs y DataCards | ✅ | ✅ |
| Ver dispositivos | ✅ | ✅ |
| Crear / editar / eliminar dispositivos | ✅ | ❌ |
| Importar dispositivos desde YAML | ✅ | ❌ |
| Clonar dispositivo | ✅ | ❌ |
| Poner dispositivo en modo mantenimiento | ✅ | ❌ |
| Editar valores de propiedades (sync bidireccional) | ✅ | ❌ |
| Exportar inventario de dispositivos (CSV/PDF) | ✅ | ✅ |
| Ver y gestionar dispositivos desconocidos | ✅ | ❌ |
| Ver propiedades | ✅ | ✅ |
| Crear / editar / eliminar propiedades | ✅ | ❌ |
| Ver telemetría y gráficas | ✅ | ✅ |
| Ver Digital Twins en tiempo real | ✅ | ✅ |
| Panel de analítica y exportación de telemetría | ✅ | ✅ |
| Gestionar reglas de alerta | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ |

---

## 7. Funcionalidades Implementadas

### 1. Gestión de dispositivos IoT
Registro completo de dispositivos con código, nombre, tipo, ubicación, namespace y etiquetas. Soporta importación masiva desde archivos YAML (un dispositivo o lista). Vista en tarjetas o lista con filtros por tipo, estado y namespace. Clonación de dispositivos con sus propiedades.

### 2. Digital Twins
Cada dispositivo tiene un gemelo digital creado automáticamente al registrarse. El twin mantiene el último estado conocido del dispositivo en formato JSON y se actualiza al recibir telemetría confirmada por Node-RED.

### 3. Sincronización bidireccional
El administrador puede editar valores de propiedades marcadas como "editables" desde el modal de información del dispositivo. El cambio se persiste en el Digital Twin, queda registrado en el historial de telemetría para trazabilidad, y se propaga al dispositivo físico mediante el flujo MQTT existente (`smartcampus/ack` → Node-RED → `smartcampus/confirm`).

### 4. Monitoreo de telemetría en tiempo real
Recepción de datos via MQTT con actualización del Digital Twin en tiempo real via WebSocket. El frontend muestra el badge "En vivo" cuando llegan datos nuevos y lo oculta tras 4 segundos.

### 5. Sistema de alertas automáticas
Reglas configurables por propiedad, operador (GREATER_THAN / LESS_THAN) y umbral desde la pestaña "Alertas". Cuando el backend recibe telemetría y se cumple una regla activa, envía la alerta en tiempo real al frontend via WebSocket (`/topic/alerts`) con un cooldown de 2 minutos por dispositivo por regla. El frontend muestra un toast con el nombre del dispositivo, la propiedad afectada, el valor y el umbral configurado.

### 6. Autenticación JWT y control de acceso por roles
Login con JWT de 24 horas firmado con HS256. Dos roles: ADMIN (acceso total) y VIEWER (solo lectura). Los botones y pestañas de escritura se ocultan automáticamente al VIEWER. El token expirado redirige al login automáticamente.

### 7. Gráficas históricas
Gráficas de temperatura, humedad y batería con Chart.js. Filtro por dispositivo y selección de últimos 20, 50 o 100 registros.

### 8. Panel de analítica y exportación de telemetría
Estadísticas por dispositivo y propiedad (mínimo, promedio, máximo, cantidad de registros). Filtros por dispositivo y rango de fechas. Exportación a CSV y PDF con tabla de estadísticas y detalle de registros.

### 9. Dashboard de KPIs
Panel de métricas de administración integrado en el Dashboard: total de dispositivos, **activos ahora** (ONLINE + LOW_BATTERY + WARNING) con nota si hay dispositivos con alerta de batería, offline, con error, total de Digital Twins activos, total de propiedades registradas, último dispositivo activo con tiempo relativo, barra de estado de la flota con todos los estados diferenciados por color (verde online, amarillo batería baja, naranja warning, rojo error, morado mantenimiento, gris offline), distribución por tipo y namespace. Se actualiza cada 30 segundos y reactivamente al recibir telemetría en vivo.

### 10. Gestión de usuarios
Interfaz para crear, editar y eliminar usuarios del sistema con asignación de rol. Muestra indicador "Tú" en el usuario activo y previene la auto-eliminación. Las contraseñas se encriptan con BCrypt. Solo accesible por ADMIN.

### 11. Modo mantenimiento
Permite retirar un dispositivo de servicio sin eliminarlo del sistema. El scheduler no cambia el estado de dispositivos en MAINTENANCE, y el procesamiento de telemetría tampoco sobreescribe su estado. El admin puede reactivarlo en cualquier momento con un solo clic.

### 12. Detección de dispositivos desconocidos
Cuando llega telemetría de un dispositivo no registrado, el sistema lo detecta, guarda el evento con el payload recibido, y notifica al frontend en tiempo real via WebSocket. El administrador ve un banner en la pestaña Dispositivos con los datos recibidos y puede crear el dispositivo (con el código pre-llenado en el formulario) o ignorar el evento.

### 13. Exportación de inventario de dispositivos
Botones CSV y PDF en el encabezado de la vista Dispositivos. El reporte incluye código, nombre, tipo, namespace, ubicación, tags, estado y última vez visto. Respeta los filtros activos exportando únicamente los dispositivos visibles en pantalla.

### 14. Documentación de la API
Swagger UI disponible en `/api/swagger-ui.html` con soporte para autenticación JWT integrada, organizado por controlador con modelos de request y response.

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

# Base de datos MySQL
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=update

# JWT
jwt.secret=smartcampus-uis-proyecto-grado-secret-key-2026-muy-larga
jwt.expiration-ms=86400000

# MQTT — HiveMQ Cloud
mqtt.broker=ssl://<host>.hivemq.cloud:8883
mqtt.username=<usuario>
mqtt.password=<contraseña>
mqtt.client-id=smartcampus-backend
```

---

## 9. Usuarios del Sistema

Los siguientes usuarios se crean automáticamente al iniciar la aplicación (`DataInitializer`) si no existen:

| Usuario | Contraseña | Rol | Permisos |
|---|---|---|---|
| `admin` | `admin123` | ADMIN | Acceso total al sistema |
| `viewer` | `viewer123` | VIEWER | Solo lectura |

> **Nota:** Se recomienda cambiar las contraseñas por defecto antes de llevar el sistema a producción real.

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
*SmartCampus UIS — Proyecto de Grado — Universidad Industrial de Santander — 2026*
