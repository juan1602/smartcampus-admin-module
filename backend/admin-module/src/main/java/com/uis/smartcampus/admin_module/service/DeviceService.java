package com.uis.smartcampus.admin_module.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.dto.TelemetryRequest;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeviceService {

    private final DeviceRepository repository;
    private final DigitalTwinRepository twinRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper = new ObjectMapper();


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
                            .status("OFFLINE")
                            .lastUpdate(LocalDateTime.now())
                            .telemetryJson("{}")
                            .build();

                    return twinRepository.save(newtwin);
                });
        saved.setTwin(twin);
        messagingTemplate.convertAndSend("/topic/devices", saved);
        return saved;
    }

    public Device update(Long id, Device device) {
        Device existing = findById(id);
        
        if (device.getName() != null) {
            existing.setName(device.getName());
        }
        if (device.getType() != null) {
            existing.setType(device.getType());
        }
        if (device.getStatus() != null) {
            existing.setStatus(device.getStatus());
        }
        if (device.getLocation() != null) {
            existing.setLocation(device.getLocation());
        }
        if (device.getComponents() != null) {
            existing.setComponents(device.getComponents());
        }
        if (device.getConfigJson() != null) {
            existing.setConfigJson(device.getConfigJson());
        }
        
        existing.setUpdatedAt(LocalDateTime.now());
        Device saved = repository.save(existing);
        messagingTemplate.convertAndSend("/topic/devices", saved);
        return saved;
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public void updateTelemetry(Long deviceId, Map<String,Object> payload) throws Exception {

        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow();

        twin.setTelemetryJson(mapper.writeValueAsString(payload));
        twin.setLastUpdate(LocalDateTime.now());

        twinRepository.save(twin);
    }
}

