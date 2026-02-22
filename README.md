# Smart Campus UIS – Módulo Web de Administración basado en Gemelo Digital

## 📌 Descripción del proyecto
Este repositorio contiene el desarrollo del **módulo web de administración** para la plataforma **Smart Campus UIS**, cuyo objetivo es permitir la gestión centralizada de dispositivos y aplicaciones IoT mediante el enfoque de **Gemelo Digital (Digital Twin)**.

El sistema permitirá:

- Registrar y administrar dispositivos IoT
- Gestionar aplicaciones asociadas
- Representar cada dispositivo mediante un gemelo digital
- Sincronización bidireccional (físico ↔ virtual)
- Visualización y monitoreo en tiempo real
- Registro histórico y trazabilidad de eventos
- Administración centralizada desde una interfaz web

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
- Spring Security
- WebSocket (tiempo real)
- Maven

### Base de datos
- MySQL 8.x

### Otras herramientas
- Lombok
- Git / GitHub
- Postman (pruebas API)

---

## 🗄️ Arquitectura general

El sistema sigue una arquitectura por capas:

Controller → Service → Repository → Database


Componentes principales:

- Gestión de dispositivos
- Gestión de gemelos digitales
- Motor de sincronización
- Registro histórico de eventos
- API REST
- Comunicación en tiempo real (WebSocket)

---

## 📅 Bitácora de desarrollo

### 🟢 08/02/2026 – Inicio del proyecto
- Creación del repositorio Git
- Generación del proyecto con Spring Initializr
- Configuración del entorno de desarrollo
- Selección de tecnologías base:
  - Java 21 (LTS)
  - Spring Boot 3.3.5
  - MySQL 8
  - Maven
- Configuración inicial del `pom.xml`
- Inclusión de dependencias:
  - Web
  - JPA
  - Security
  - Validation
  - WebSocket
  - MySQL Driver
  - Lombok
- Estructuración base del proyecto backend

---

### 🟢 12/02/2026 – Módulo de Dispositivos + Primer Gemelo Digital
Se implementó el primer módulo funcional del sistema.

#### Funcionalidades desarrolladas
- CRUD completo de dispositivos:
  - GET /devices
  - GET /devices/{id}
  - POST /devices
  - PUT /devices/{id}
  - DELETE /devices/{id}

- Persistencia con Spring Data JPA + MySQL
- Relación 1:1 entre Device y DigitalTwin
- Creación automática del gemelo digital al registrar un dispositivo
- Serialización JSON sin recursividad infinita
- Arquitectura por capas (Controller, Service, Repository, Model)

#### Comportamiento actual
Al crear un dispositivo:

POST /devices

El sistema:
1. Guarda el Device
2. Genera automáticamente su DigitalTwin
3. Inicializa:
   - status: OFFLINE
   - telemetryJson: {}
   - lastUpdate: timestamp actual

Esto garantiza que **todo dispositivo registrado posee su representación virtual desde el inicio**.

#### Estado del módulo
✅ Backend funcional  
✅ Base de datos conectada  
✅ API REST operativa  
✅ Primer Digital Twin implementado  

---
### 🟢 22/02/2026 – Integración de Protocolo MQTT para Telemetría IoT
Para la transmisión de datos desde los dispositivos IoT hacia el backend se implementó el protocolo MQTT (Message Queuing Telemetry Transport), debido a su bajo consumo de ancho de banda, arquitectura basada en publicación/suscripción y eficiencia en entornos con múltiples dispositivos. 

#### Arquitectura implementada
Dispositivo IoT (simulado)
        ↓
Broker MQTT (Mosquitto)
        ↓
Subscriber en Spring Boot
        ↓
Actualización DigitalTwin
        ↓
Persistencia en MySQL
        ↓
API REST para visualización

#### Proceso de actualización
El algorito realiza el siguiente paso a paso:
  1. Recepción del mensaje MQTT
  2. Extracción del deviceCode desde el topic
  3. Búsqueda del Device en base de datos
  4. Recuperación del DigitalTwin asociado
  5. Parseo del JSON (Convertir un texto en formato JSON en un objeto que el programa pueda leer, interpretar y usar.)
  6. Actualización de estado y métricas
  7. Persistencia transaccional

---

## ⚙️ Configuración del proyecto

### Requisitos
- Java 21+
- Maven 3.9+
- MySQL 8+
- IDE (IntelliJ / VS Code / Eclipse)

---

## 📂 Estructura del proyecto

src/main/java/com/uis/smartcampus
├── controller   → Endpoints REST
├── service      → Lógica de negocio
├── repository   → Acceso a datos (JPA)
├── model        → Entidades (Device, Twin, etc.)
├── dto          → Objetos de transferencia
└── config       → Configuraciones (Security, WebSocket)

---

## ▶️ Ejecución

Clonar el repositorio:

git clone <url-del-repo>

Ejecutar:

mvn spring-boot:run

Abrir en el navegador:
http://localhost:8090/devices

---

## 🎯 Próximos pasos

- [✅] Definir entidades Device y DigitalTwin
- [✅] Implementar CRUD de dispositivos
- [✅] Crear gemelo digital automático
- [  ] Endpoint de telemetría en tiempo real
- [  ] WebSocket para monitoreo en vivo
- [  ] Dashboard frontend
- [  ] Seguridad JWT
- [  ] Pruebas unitarias
- [  ] Documentación técnica


