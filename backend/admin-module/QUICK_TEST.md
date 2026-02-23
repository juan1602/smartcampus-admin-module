# 🚀 PLAN DE PRUEBAS - RESUMEN RÁPIDO

## PASO 1: COMPILAR Y EJECUTAR (3 minutos)

```bash
# En PowerShell o Terminal:
cd c:\Users\Personal\Documents\Proyecto-grado\backend\admin-module
mvn clean install -DskipTests
java -jar target/admin-module-0.0.1-SNAPSHOT.jar
```

**Espera a ver:**
```
[main] c.u.s.a.SmartcampusAdminApplication : Started SmartcampusAdminApplication in XXX seconds
```

✅ La app está en: `http://localhost:8080`

---

## PASO 2: ABRIR POSTMAN O CMD (2 minutos)

### Opción A: Usar Postman (más fácil)
1. Descarga: https://www.postman.com/downloads/
2. Abre Postman
3. Crea una carpeta llamada "SmartCampus"
4. Sigue los pasos de abajo con los requests en Postman

### Opción B: Usar PowerShell (línea de comando)
1. Abre PowerShell
2. Copia y pega los comandos curl directamente

---

## PASO 3: CREAR COMPONENTES (1 minuto)

**En Postman o PowerShell, ejecuta estos 4 requests:**

```
POST http://localhost:8080/components

1. {"name": "temperature", "unit": "°C", "description": "Temperatura"}
2. {"name": "humidity", "unit": "%", "description": "Humedad"}
3. {"name": "pressure", "unit": "hPa", "description": "Presión"}
4. {"name": "battery_level", "unit": "%", "description": "Batería"}
```

**Respuesta esperada:**
```json
{"id": 1, "name": "temperature", "unit": "°C", ...}
{"id": 2, "name": "humidity", "unit": "%", ...}
{"id": 3, "name": "pressure", "unit": "hPa", ...}
{"id": 4, "name": "battery_level", "unit": "%", ...}
```

✅ Recuerda los IDs (1, 2, 3, 4)

---

## PASO 4: CREAR DISPOSITIVOS (1 minuto)

```
POST http://localhost:8080/devices

1. {
  "code": "SENSOR-LAB-01",
  "name": "Sensor Laboratorio",
  "type": "SENSOR",
  "location": "Lab A"
}

2. {
  "code": "SENSOR-OFFICE-01",
  "name": "Sensor Oficina",
  "type": "SENSOR",
  "location": "Office B"
}
```

**Respuesta esperada:**
```json
{"id": 1, "code": "SENSOR-LAB-01", ...}
{"id": 2, "code": "SENSOR-OFFICE-01", ...}
```

✅ Recuerda los IDs de dispositivos (1, 2)

---

## PASO 5: ASIGNAR COMPONENTES (1 minuto)

**Dispositivo 1 (LAB): Temperatura + Humedad + Batería**
```
POST http://localhost:8080/components/devices/1/assign

{
  "componentIds": [1, 2, 4]
}
```

**Dispositivo 2 (OFFICE): Temperatura + Presión**
```
POST http://localhost:8080/components/devices/2/assign

{
  "componentIds": [1, 3]
}
```

---

## PASO 6: ENVIAR DATOS (2 minutos)

**Dispositivo 1 con sus componentes (temp + humidity + battery):**
```
POST http://localhost:8080/telemetry/1

{
  "temperature": 22.5,
  "humidity": 55.0,
  "battery_level": 87
}
```

**Respuesta esperada:**
```json
{
  "deviceId": 1,
  "deviceCode": "SENSOR-LAB-01",
  "deviceName": "Sensor Laboratorio",
  "status": "ONLINE",
  "telemetry": {
    "temperature": 22.5,
    "humidity": 55.0,
    "battery_level": 87
  },
  "lastUpdate": "2026-02-22T..."
}
```

**Dispositivo 2 con sus componentes (temp + pressure):**
```
POST http://localhost:8080/telemetry/2

{
  "temperature": 21.0,
  "pressure": 1013.25
}
```

---

## PASO 7: PRUEBA CRÍTICA ⚠️

**Envía componentes NO asignados:**

Dispositivo 1 solo tiene: `[temperature, humidity, battery_level]`

Intenta enviar `pressure` (NO asignado):
```
POST http://localhost:8080/telemetry/1

{
  "temperature": 22.5,
  "pressure": 1000,
  "humidity": 55.0,
  "battery_level": 87
}
```

**✅ RESULTADO ESPERADO: `pressure` se IGNORA**
```json
{
  "telemetry": {
    "temperature": 22.5,
    "humidity": 55.0,
    "battery_level": 87
  }
}
```

---

## PASO 8: LEER DATOS (1 minuto)

```
GET http://localhost:8080/telemetry/1
GET http://localhost:8080/telemetry/2
```

Devuelve los últimos datos guardados.

---

## 📊 RESUMEN DE FLUJO

```
1. Crear Componentes (4)
   ↓
2. Crear Dispositivos (2)
   ↓
3. Asignar Componentes a cada Dispositivo
   ↓
4. Enviar Telemetría (datos)
   ↓
5. El Sistema filtra automáticamente
   ↓
6. Guardar solo componentes asignados
   ↓
7. Leer datos guardados ✅
```

---

## 🎯 VALIDACIÓN FINAL

Si todo esto funciona, tu sistema está **100% operativo:**

- ✅ Componentes dinámicos creados
- ✅ Dispositivos creados
- ✅ Asignación de componentes funcionando
- ✅ Telemetría procesada correctamente
- ✅ Filtrado automático de componentes
- ✅ Diferentes dispositivos con diferentes datos

---

## ⏱️ TIEMPO TOTAL: ~10-15 minutos

Para más detalles, ver: `TESTING_GUIDE.md`

