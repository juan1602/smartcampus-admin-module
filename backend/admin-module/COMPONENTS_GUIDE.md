# Guía: Sistema de Componentes Dinámicos

## Descripción General
El sistema ahora soporta **diferentes tipos de componentes** para cada dispositivo. Esto significa que:
- Un dispositivo puede tener sensor de temperatura, humedad y presión
- Otro dispositivo puede tener solo temperatura y batería
- Un tercero puede tener sensores personalizados

**Ya no está limitado a solo temperatura.**

---

## 1. Crear Componentes Disponibles

Primero, define los tipos de componentes que existen en tu sistema:

```bash
POST /components
Content-Type: application/json

{
  "name": "temperature",
  "unit": "°C",
  "description": "Temperatura en grados Celsius"
}
```

**Ejemplos de componentes que puedes crear:**

```json
{
  "name": "humidity",
  "unit": "%",
  "description": "Humedad relativa"
}

{
  "name": "pressure",
  "unit": "hPa",
  "description": "Presión atmosférica"
}

{
  "name": "battery_level",
  "unit": "%",
  "description": "Nivel de batería"
}

{
  "name": "co2",
  "unit": "ppm",
  "description": "Dióxido de carbono"
}
```

### Ver todos los componentes disponibles
```bash
GET /components
```

---

## 2. Asignar Componentes a un Dispositivo

Ahora asigna los componentes que tu dispositivo puede enviar:

```bash
POST /components/devices/{deviceId}/assign
Content-Type: application/json

{
  "componentIds": [1, 2, 3]
}
```

**Ejemplo:**
```bash
# Para un dispositivo que envía temperatura, humedad y batería
POST /components/devices/5/assign
{
  "componentIds": [1, 2, 4]  // temperature, humidity, battery_level
}
```

### Ver componentes de un dispositivo
```bash
GET /components/devices/{deviceId}
```

### Agregar un componente individual
```bash
POST /components/devices/{deviceId}/add/{componentId}
```

### Remover un componente
```bash
DELETE /components/devices/{deviceId}/remove/{componentId}
```

---

## 3. Enviar Telemetría (MQTT)

Tu dispositivo puede enviar datos en el formato:

```json
{
  "temperature": 22.5,
  "humidity": 45.2,
  "battery_level": 87
}
```

**El sistema automáticamente:**
1. Valida que solo los componentes definidos sean procesados
2. Rechaza componentes no autorizados
3. Guarda los datos en el DigitalTwin

---

## 4. Enviar Telemetría (HTTP REST)

También puedes enviar telemetría directamente por HTTP:

```bash
POST /telemetry/{deviceId}
Content-Type: application/json

{
  "temperature": 22.5,
  "humidity": 45.2
}
```

### Obtener última telemetría
```bash
GET /telemetry/{deviceId}
```

**Respuesta:**
```json
{
  "deviceId": 5,
  "deviceCode": "SENSOR-01",
  "deviceName": "Sensor Laboratorio",
  "status": "ONLINE",
  "telemetry": {
    "temperature": 22.5,
    "humidity": 45.2
  },
  "lastUpdate": "2024-02-22T14:30:00"
}
```

---

## 5. Arquitectura de Datos

### Tabla: `components`
```
id (PK)
name (UNIQUE) - "temperature", "humidity", etc.
unit - "°C", "%", etc.
description
created_at
```

### Tabla: `device_components` (Many-to-Many)
```
device_id (FK)
component_id (FK)
```

### Relaciones
- **Device** (1) ← → (N) **Component** (Many-to-Many)
- **Device** (1) ← → (1) **DigitalTwin**

---

## 6. Ejemplo Completo de Uso

### Paso 1: Crear componentes disponibles
```bash
POST /components
{ "name": "temperature", "unit": "°C" }

POST /components
{ "name": "humidity", "unit": "%" }
```

### Paso 2: Crear un dispositivo
```bash
POST /devices
{
  "code": "SENSOR-LAB-01",
  "name": "Sensor Laboratorio",
  "type": "SENSOR",
  "location": "Lab A"
}
# Retorna: deviceId = 1
```

### Paso 3: Asignar componentes al dispositivo
```bash
POST /components/devices/1/assign
{
  "componentIds": [1, 2]  // temperature y humidity
}
```

### Paso 4: Enviar telemetría
```bash
POST /telemetry/1
{
  "temperature": 22.5,
  "humidity": 55.0
}
```

### Paso 5: Leer telemetría
```bash
GET /telemetry/1

# Respuesta:
{
  "deviceId": 1,
  "deviceCode": "SENSOR-LAB-01",
  "deviceName": "Sensor Laboratorio",
  "status": "ONLINE",
  "telemetry": {
    "temperature": 22.5,
    "humidity": 55.0
  },
  "lastUpdate": "2024-02-22T14:30:00"
}
```

---

## 7. Ventajas del Nuevo Sistema

✅ **Flexibilidad:** Soporta cualquier tipo de componente  
✅ **Escalabilidad:** Agregar nuevos componentes es trivial  
✅ **Validación:** Solo acepta componentes definidos  
✅ **Mantenibilidad:** Cambios centralizados en componentes  
✅ **Reutilizable:** Componentes compartidos entre dispositivos diferentes  

---

## 8. Notas Importantes

- Si un dispositivo **no tiene componentes asignados**, aceptará cualquier telemetría
- Si un dispositivo **tiene componentes asignados**, filtará la telemetría automáticamente
- Los nombres de componentes son **case-sensitive**: `temperature` ≠ `Temperature`
- El sistema guarda toda la telemetría en formato JSON para máxima flexibilidad
