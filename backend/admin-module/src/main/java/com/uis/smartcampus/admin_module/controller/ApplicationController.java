package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.Application;
import com.uis.smartcampus.admin_module.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<List<Application>> getAll() {
        return ResponseEntity.ok(applicationService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Application> create(@RequestBody Application application) {
        return ResponseEntity.ok(applicationService.create(application));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> update(@PathVariable Long id, @RequestBody Application application) {
        return ResponseEntity.ok(applicationService.update(id, application));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{appId}/devices/{deviceId}")
    public ResponseEntity<Application> addDevice(@PathVariable Long appId, @PathVariable Long deviceId) {
        return ResponseEntity.ok(applicationService.addDevice(appId, deviceId));
    }

    @DeleteMapping("/{appId}/devices/{deviceId}")
    public ResponseEntity<Application> removeDevice(@PathVariable Long appId, @PathVariable Long deviceId) {
        return ResponseEntity.ok(applicationService.removeDevice(appId, deviceId));
    }
}