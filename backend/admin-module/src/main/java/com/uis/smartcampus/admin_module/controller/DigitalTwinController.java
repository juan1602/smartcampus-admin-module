package com.uis.smartcampus.admin_module.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.service.DigitalTwinService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/twins")
@RequiredArgsConstructor
@Slf4j
public class DigitalTwinController {

    private final DigitalTwinService service;

    @GetMapping
    public List<DigitalTwin> getAll() {
        log.info("GET /twins");
        return service.findAll();
    }

    @GetMapping("/{id}")
    public DigitalTwin getById(@PathVariable Long id) {
        log.info("GET /twins/{}", id);
        return service.findById(id);
    }

    @PostMapping
    public DigitalTwin create(@RequestBody DigitalTwin twin) {
        log.info("POST /twins");
        return service.save(twin);
    }

    @PutMapping("/{id}")
    public DigitalTwin update(@PathVariable Long id, @RequestBody DigitalTwin twin) {
        log.info("PUT /twins/{}", id);
        twin.setId(id);
        return service.save(twin);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        log.info("DELETE /twins/{}", id);
        service.delete(id);
    }

    @PostMapping("/{deviceId}")
    public DigitalTwin receiveTelemetry(
            @PathVariable Long deviceId,
            @RequestBody Map<String, Object> payload) throws Exception {
        log.debug("POST /twins/{}", deviceId);

        return service.updateTelemetry(deviceId, payload);
    }

}