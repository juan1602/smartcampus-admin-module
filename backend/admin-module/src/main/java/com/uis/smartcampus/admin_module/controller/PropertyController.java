package com.uis.smartcampus.admin_module.controller;
import com.uis.smartcampus.admin_module.model.Property;
import com.uis.smartcampus.admin_module.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyRepository repository;

    @GetMapping
    public List<Property> findAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Property findById(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Property not found"));
    }

    @PostMapping
    public Property save(@RequestBody Property property) {
        return repository.save(property);
    }

    @PutMapping("/{id}")
    public Property update(@PathVariable Long id, @RequestBody Property property) {
        property.setId(id);
        return repository.save(property);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
