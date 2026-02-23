package com.uis.smartcampus.admin_module.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.repository.ComponentRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComponentService {

    private final ComponentRepository repository;

    public List<Component> findAll() {
        return repository.findAll();
    }

    public Component findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Component not found"));
    }

    public Optional<Component> findByName(String name) {
        return repository.findByName(name);
    }

    public Component save(Component component) {
        return repository.save(component);
    }

    public Component update(Long id, Component component) {
        Component existing = findById(id);
        
        if (component.getName() != null) {
            existing.setName(component.getName());
        }
        if (component.getUnit() != null) {
            existing.setUnit(component.getUnit());
        }
        if (component.getDescription() != null) {
            existing.setDescription(component.getDescription());
        }
        
        return repository.save(existing);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
