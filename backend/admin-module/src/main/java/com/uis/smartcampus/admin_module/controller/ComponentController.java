package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.repository.ComponentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/components")
@RequiredArgsConstructor
public class ComponentController {

    private final ComponentRepository repository;

    @GetMapping
    public List<Component> findAll() {
        return repository.findAll();
    }

    @PostMapping
    public Component save(@RequestBody Component component) {
        return repository.save(component);
    }
}