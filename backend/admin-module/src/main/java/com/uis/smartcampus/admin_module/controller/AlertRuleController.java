package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.AlertRule;
import com.uis.smartcampus.admin_module.repository.AlertRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alert-rules")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleRepository repository;

    @GetMapping
    public List<AlertRule> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public AlertRule create(@RequestBody AlertRule rule) {
        return repository.save(rule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlertRule> update(@PathVariable Long id, @RequestBody AlertRule rule) {
        return repository.findById(id).map(existing -> {
            existing.setProperty(rule.getProperty());
            existing.setOperator(rule.getOperator());
            existing.setThreshold(rule.getThreshold());
            existing.setLabel(rule.getLabel());
            existing.setActive(rule.isActive());
            return ResponseEntity.ok(repository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
