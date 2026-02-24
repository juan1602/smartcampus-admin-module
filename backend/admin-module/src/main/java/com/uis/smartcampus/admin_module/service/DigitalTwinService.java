package com.uis.smartcampus.admin_module.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class DigitalTwinService {

    private final DigitalTwinRepository repository;
    private final DeviceRepository deviceRepository;

    public List<DigitalTwin> findAll() {
        return repository.findAll();
    }

    public DigitalTwin findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Twin not found"));
    }

    public DigitalTwin save(DigitalTwin twin) {
        twin.setLastUpdate(LocalDateTime.now());
        return repository.save(twin);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public DigitalTwin updateTelemetry(Long deviceId, Map<String, Object> payload) throws Exception {

    Device device = deviceRepository.findById(deviceId)
            .orElseThrow(() -> new EntityNotFoundException("Device not found"));

    Set<String> allowedComponents = device.getComponents()
            .stream()
            .map(Component::getName)
            .collect(Collectors.toSet());

    Map<String, Object> filtered = payload.entrySet()
            .stream()
            .filter(entry -> allowedComponents.contains(entry.getKey()))
            .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    Map.Entry::getValue
            ));

    ObjectMapper mapper = new ObjectMapper();
    String json = mapper.writeValueAsString(filtered);

    DigitalTwin twin = device.getTwin();
    twin.setTelemetryJson(json);
    twin.setStatus("ONLINE");
    twin.setLastUpdate(LocalDateTime.now());

    return repository.save(twin);
}

}
