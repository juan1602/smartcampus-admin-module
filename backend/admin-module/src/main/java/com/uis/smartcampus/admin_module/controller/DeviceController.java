package com.uis.smartcampus.admin_module.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
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

@RestController
@RequestMapping("/devices")
@RequiredArgsConstructor
@CrossOrigin
public class DeviceController {

    private final DeviceService service;

     @GetMapping
    public List<Device> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public Device getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Device create(@RequestBody Device device) {
        return service.save(device);
    }

    @PostMapping("/{id}/telemetry")
    public void updateTelemetry(
        @PathVariable Long id,
        @RequestBody Map<String,Object> payload) throws Exception {

    service.updateTelemetry(id, payload);
    }



    @PutMapping("/{id}")
    public Device update(@PathVariable Long id, @RequestBody Device device) {
        device.setId(id);
        return service.save(device);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
