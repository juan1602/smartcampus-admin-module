package com.uis.smartcampus.admin_module.controller;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.service.DeviceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
@Slf4j
public class DeviceController {

    private final DeviceService service;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        log.info("GET /devices/stats");
        return service.getStats();
    }

    @GetMapping
    public List<Device> getAll() {
        log.info("GET /devices");
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Device getById(@PathVariable Long id) {
        log.info("GET /devices/{}", id);
        return service.findById(id);
    }

    @PostMapping
    public Device create(@RequestBody Device device) {
        log.info("POST /devices");
        return service.save(device);
    }

    @PutMapping("/{id}")
    public Device update(@PathVariable Long id, @RequestBody Device device) {
        log.info("PUT /devices/{}", id);
        device.setId(id);
        return service.save(device);
    }

    @PostMapping("/{deviceId}/components")
    public Device assignComponents(
            @PathVariable Long deviceId,
            @RequestBody Set<Long> componentIds) {
        log.info("POST /devices/{}/components", deviceId);

        return service.assignComponents(deviceId, componentIds);
    }

    @PostMapping("/{id}/maintenance")
    public ResponseEntity<?> toggleMaintenance(@PathVariable Long id) {
        log.info("POST /devices/{}/maintenance", id);
        service.toggleMaintenance(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        log.info("DELETE /devices/{}", id);
        service.delete(id);
    }
    @PostMapping("/{id}/property-value")
    public ResponseEntity<?> updatePropertyValue(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        log.info("POST /devices/{}/property-value", id);

        service.updatePropertyValue(
                id,
                body.get("propertyName").toString(),
                body.get("value")
        );

        return ResponseEntity.ok().build();
    }
}