package com.uis.smartcampus.admin_module.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.service.DigitalTwinService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/twins")
@RequiredArgsConstructor
@CrossOrigin
public class DigitalTwinController {

    private final DigitalTwinService service;

    @GetMapping
    public List<DigitalTwin> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public DigitalTwin getById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public DigitalTwin create(@RequestBody DigitalTwin twin) {
        return service.save(twin);
    }

    @PutMapping("/{id}")
    public DigitalTwin update(@PathVariable Long id, @RequestBody DigitalTwin twin) {
        twin.setId(id);
        return service.save(twin);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

}
