package com.uis.smartcampus.admin_module.service;

import com.uis.smartcampus.admin_module.model.Application;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.repository.ApplicationRepository;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final DeviceRepository deviceRepository;

    public List<Application> getAll() {
        return applicationRepository.findAll();
    }

    public Application getById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Aplicación no encontrada con id: " + id));
    }

    public Application create(Application application) {
        return applicationRepository.save(application);
    }

    public Application update(Long id, Application updated) {
        Application existing = getById(id);
        existing.setName(updated.getName());
        existing.setRepository(updated.getRepository());
        existing.setStatus(updated.getStatus());
        return applicationRepository.save(existing);
    }

    public void delete(Long id) {
        applicationRepository.deleteById(id);
    }

    public Application addDevice(Long appId, Long deviceId) {
        Application app = getById(appId);
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new RuntimeException("Dispositivo no encontrado con id: " + deviceId));
        app.getDevices().add(device);
        return applicationRepository.save(app);
    }

    public Application removeDevice(Long appId, Long deviceId) {
        Application app = getById(appId);
        app.getDevices().removeIf(d -> d.getId().equals(deviceId));
        return applicationRepository.save(app);
    }
}