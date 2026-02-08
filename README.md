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
http://localhost:8080


---

## 🎯 Próximos pasos

- [ ] Definir entidades Device y DigitalTwin
- [ ] Implementar CRUD de dispositivos
- [ ] Implementar sincronización bidireccional
- [ ] Configurar seguridad JWT
- [ ] Implementar WebSocket para monitoreo en tiempo real
- [ ] Pruebas unitarias
- [ ] Documentación técnica


