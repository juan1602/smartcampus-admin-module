package com.uis.smartcampus.admin_module.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.uis.smartcampus.admin_module.model.Property;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.PropertyRepository;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository repository;
    private final DigitalTwinRepository twinRepository;
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

    DigitalTwin twin = device.getTwin();

    ObjectMapper mapper = new ObjectMapper();

    Map<String, Object> telemetry;

    try {

        telemetry = twin.getTelemetryJson() != null
                ? mapper.readValue(twin.getTelemetryJson(), Map.class)
                : new HashMap<>();

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
