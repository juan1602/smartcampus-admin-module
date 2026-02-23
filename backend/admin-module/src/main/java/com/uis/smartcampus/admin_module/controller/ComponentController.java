package com.uis.smartcampus.admin_module.controller;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.uis.smartcampus.admin_module.dto.ComponentDTO;
import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.service.ComponentService;
import com.uis.smartcampus.admin_module.service.DeviceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/components")
@RequiredArgsConstructor
@CrossOrigin
public class ComponentController {

    private final ComponentService componentService;
    private final DeviceService deviceService;

    /**
     * Obtener todos los componentes disponibles
     */
    @GetMapping
    public ResponseEntity<List<ComponentDTO>> getAllComponents() {
        List<Component> components = componentService.findAll();
        List<ComponentDTO> dtos = components.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Crear un nuevo tipo de componente
     */
    @PostMapping
    public ResponseEntity<ComponentDTO> createComponent(@RequestBody ComponentDTO dto) {
        Component component = Component.builder()
                .name(dto.getName())
                .unit(dto.getUnit())
                .description(dto.getDescription())
                .build();
        
        Component saved = componentService.save(component);
        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    /**
     * Actualizar un componente
     */
    @PutMapping("/{id}")
    public ResponseEntity<ComponentDTO> updateComponent(
            @PathVariable Long id,
            @RequestBody ComponentDTO dto) {
        Component component = Component.builder()
                .name(dto.getName())
                .unit(dto.getUnit())
                .description(dto.getDescription())
                .build();
        
        Component updated = componentService.update(id, component);
        return ResponseEntity.ok(toDTO(updated));
    }

    /**
     * Eliminar un componente
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComponent(@PathVariable Long id) {
        componentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Asignar componentes a un dispositivo
     * POST /components/devices/{deviceId}/assign
     * Body: {"componentIds": [1, 2, 3]}
     */
    @PostMapping("/devices/{deviceId}/assign")
    public ResponseEntity<Map<String, Object>> assignComponentsToDevice(
            @PathVariable Long deviceId,
            @RequestBody Map<String, List<Long>> request) {
        
        Device device = deviceService.findById(deviceId);
        List<Long> componentIds = request.get("componentIds");

        if (componentIds == null || componentIds.isEmpty()) {
            device.setComponents(new HashSet<>());
        } else {
            Set<Component> components = componentIds.stream()
                    .map(componentService::findById)
                    .collect(Collectors.toSet());
            device.setComponents(components);
        }

        Device updated = deviceService.update(deviceId, device);
        
        Map<String, Object> response = new HashMap<>();
        response.put("deviceId", updated.getId());
        response.put("code", updated.getCode());
        response.put("components", updated.getComponents().stream()
                .map(this::toDTO)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Obtener componentes de un dispositivo
     * GET /components/devices/{deviceId}
     */
    @GetMapping("/devices/{deviceId}")
    public ResponseEntity<Map<String, Object>> getDeviceComponents(@PathVariable Long deviceId) {
        Device device = deviceService.findById(deviceId);
        
        List<ComponentDTO> componentDtos = device.getComponents().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("deviceId", device.getId());
        response.put("code", device.getCode());
        response.put("name", device.getName());
        response.put("components", componentDtos);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Agregar un componente a un dispositivo
     * POST /components/devices/{deviceId}/add/{componentId}
     */
    @PostMapping("/devices/{deviceId}/add/{componentId}")
    public ResponseEntity<Map<String, Object>> addComponentToDevice(
            @PathVariable Long deviceId,
            @PathVariable Long componentId) {
        
        Device device = deviceService.findById(deviceId);
        Component component = componentService.findById(componentId);
        
        if (device.getComponents() == null) {
            device.setComponents(new HashSet<>());
        }
        
        device.getComponents().add(component);
        Device updated = deviceService.update(deviceId, device);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Componente agregado");
        response.put("deviceId", updated.getId());
        response.put("components", updated.getComponents().stream()
                .map(this::toDTO)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Remover un componente de un dispositivo
     * DELETE /components/devices/{deviceId}/remove/{componentId}
     */
    @DeleteMapping("/devices/{deviceId}/remove/{componentId}")
    public ResponseEntity<Map<String, Object>> removeComponentFromDevice(
            @PathVariable Long deviceId,
            @PathVariable Long componentId) {
        
        Device device = deviceService.findById(deviceId);
        Component component = componentService.findById(componentId);
        
        if (device.getComponents() != null) {
            device.getComponents().remove(component);
        }
        
        Device updated = deviceService.update(deviceId, device);
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Componente removido");
        response.put("deviceId", updated.getId());
        response.put("components", updated.getComponents().stream()
                .map(this::toDTO)
                .collect(Collectors.toList()));
        
        return ResponseEntity.ok(response);
    }

    private ComponentDTO toDTO(Component component) {
        return ComponentDTO.builder()
                .id(component.getId())
                .name(component.getName())
                .unit(component.getUnit())
                .description(component.getDescription())
                .build();
    }
}
