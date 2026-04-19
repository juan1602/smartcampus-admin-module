package com.uis.smartcampus.admin_module.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uis.smartcampus.admin_module.model.Property;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import com.uis.smartcampus.admin_module.repository.PropertyRepository;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.TelemetryRecordRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository repository;
    private final DigitalTwinRepository twinRepository;
    private final MqttPublisherService mqttPublisher;
    private final TelemetryRecordRepository telemetryRecordRepository;
    @Autowired
    private PropertyRepository propertyRepository;


    public List<Device> findAll() {
        return repository.findAll();
    }

     public Device findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Device not found with id " + id));
    }

    public Device save(Device device) {

        // 1️⃣ Guardar device primero
        Device saved = repository.save(device);

        // 2️⃣ Crear twin automáticamente si no existe
        DigitalTwin twin = twinRepository.findByDeviceId(saved.getId())
                .orElseGet(() -> {

                    DigitalTwin newtwin = DigitalTwin.builder()
                            .device(saved)
                            .lastUpdate(LocalDateTime.now())
                            .telemetryJson("{}")
                            .build();

                    return twinRepository.save(newtwin);
                });
        saved.setTwin(twin);
        return saved;
    }

    @Transactional
    public void updatePropertyValue(Long deviceId, String propertyName, Object value) {

    
        Device device = repository.findById(deviceId)
            .orElseThrow(() -> new RuntimeException("Device not found"));

        // normalizar nombre de propiedad
        propertyName = propertyName.trim().toLowerCase();

        // obtener propiedades válidas del dispositivo
        Set<String> validProperties = device.getProperties()
            .stream()
            .map(p -> p.getName().trim().toLowerCase())
            .collect(Collectors.toSet());
        // validar que exista la propiedad en el dispositivo
        if (!validProperties.contains(propertyName)) {
            throw new RuntimeException("Property not valid for this device");
        }

        DigitalTwin twin = device.getTwin();

        ObjectMapper mapper = new ObjectMapper();

        Map<String, Object> telemetry;

        try {

            telemetry = twin.getTelemetryJson() != null
                ? mapper.readValue(twin.getTelemetryJson(), Map.class)
                : new HashMap<>();
            Map<String, Object> normalizedTelemetry= new HashMap<>();
            for (Map.Entry<String, Object> entry : telemetry.entrySet()) {

                String normalizedKey = entry.getKey().trim().toLowerCase();
                normalizedTelemetry.put(normalizedKey, entry.getValue());

            }
            telemetry.clear();
            telemetry.putAll(normalizedTelemetry);
            // limpiar propiedades que ya no son válidas (en caso de cambios en el dispositivo)
            telemetry.keySet().removeIf(key -> !validProperties.contains(key.toLowerCase()));

            // verificar si el valor realmente cambio
            Object currentValue = telemetry.get(propertyName);
            if (currentValue != null && currentValue.equals(value)) {
                System.out.println("Valor de propiedad '" + propertyName + "' no ha cambiado, no se actualiza");
                return;
            }
            

        } catch (Exception e) {

        telemetry = new HashMap<>();

        }

        telemetry.put(propertyName, value);

        try {

            twin.setTelemetryJson(mapper.writeValueAsString(telemetry));

        } catch (Exception e) {

            throw new RuntimeException("Error updating telemetry");

        }

        twin.setLastUpdate(LocalDateTime.now());
        twinRepository.save(twin);

        // Guardar en historial de telemetría para trazabilidad
        try {
            Map<String, Object> recordData = new HashMap<>();
            recordData.put(propertyName, value);
            TelemetryRecord record = new TelemetryRecord();
            record.setDevice(device);
            record.setTelemetryJson(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(recordData));
            record.setTimestamp(LocalDateTime.now());
            telemetryRecordRepository.save(record);
        } catch (Exception e) {
            System.err.println("❌ Error guardando registro de telemetría: " + e.getMessage());
        }

        // Publicar el cambio por el mismo flujo de Node-RED (ack → confirm → RPi)
        Map<String, Object> configData = new HashMap<>();
        configData.put(propertyName, value);
        mqttPublisher.publishAck(device.getCode(), configData);
    }

    public Map<String, Object> getStats() {
        List<Device> devices = repository.findAll();
        long totalProperties = propertyRepository.count();
        long totalTwins     = twinRepository.count();

        long online  = devices.stream().filter(d -> "ONLINE".equalsIgnoreCase(d.getStatus())).count();
        long offline = devices.stream().filter(d -> "OFFLINE".equalsIgnoreCase(d.getStatus())).count();
        long error   = devices.stream().filter(d -> "ERROR".equalsIgnoreCase(d.getStatus())).count();

        // Dispositivo visto más recientemente
        Map<String, Object> lastSeen = devices.stream()
            .filter(d -> d.getLastSeen() != null)
            .max(Comparator.comparing(Device::getLastSeen))
            .map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", d.getName() != null ? d.getName() : d.getCode());
                m.put("code", d.getCode());
                m.put("lastSeen", d.getLastSeen().toString());
                m.put("status", d.getStatus());
                return m;
            }).orElse(null);

        // Conteo por tipo de dispositivo
        Map<String, Long> byType = devices.stream()
            .filter(d -> d.getType() != null)
            .collect(Collectors.groupingBy(d -> d.getType().toUpperCase(), Collectors.counting()));

        // Conteo por namespace (agrupación lógica)
        Map<String, Long> byNamespace = devices.stream()
            .filter(d -> d.getNamespace() != null && !d.getNamespace().isBlank())
            .collect(Collectors.groupingBy(Device::getNamespace, Collectors.counting()));

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDevices",    devices.size());
        stats.put("onlineCount",     online);
        stats.put("offlineCount",    offline);
        stats.put("errorCount",      error);
        stats.put("totalTwins",      totalTwins);
        stats.put("totalProperties", totalProperties);
        stats.put("lastSeenDevice",  lastSeen);
        stats.put("byType",          byType);
        stats.put("byNamespace",     byNamespace);

        return stats;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Device assignComponents(Long deviceId, Set<Long> propertyIds) {

        Device device = repository.findById(deviceId)
            .orElseThrow();

        Set<Property> properties = new HashSet<>(
            propertyRepository.findAllById(propertyIds)
        );

        device.setProperties(properties);

        return repository.save(device);
    }

}
