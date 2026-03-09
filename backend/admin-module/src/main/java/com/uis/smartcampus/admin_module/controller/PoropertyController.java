package com.uis.smartcampus.admin_module.controller;
import com.uis.smartcampus.admin_module.model.Property;
import com.uis.smartcampus.admin_module.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PoropertyController {
    
    private final PropertyRepository repository;

    @GetMapping
    public List<Property> findAll() {
        return repository.findAll();
    }

    @PostMapping
    public Property save(@RequestBody Property property) {
        return repository.save(property);
    }

}
