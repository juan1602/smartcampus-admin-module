package com.uis.smartcampus.admin_module.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor

public class DigitalTwinService {

    private final DigitalTwinRepository repository;

    public List<DigitalTwin> findAll() {
        return repository.findAll();
    }

    public DigitalTwin findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Twin not found"));
    }

    public DigitalTwin save(DigitalTwin twin) {
        twin.setLastUpdate(LocalDateTime.now());
        return repository.save(twin);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

}
