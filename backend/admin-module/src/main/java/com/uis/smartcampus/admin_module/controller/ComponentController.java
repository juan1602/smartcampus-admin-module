package com.uis.smartcampus.admin_module.controller;

import java.util.List;

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
@RequestMapping("/devices/{deviceId}/components")
@RequiredArgsConstructor
@CrossOrigin
public class ComponentController {

    private final ComponentService componentService;
    private final DeviceService deviceService;

    /**
     * Obtener todos los componentes de un dispositivo
     */
    @GetMapping
    public ResponseEntity<List<ComponentDTO>> getComponentsByDevice(@PathVariable Long deviceId) {
        deviceService.findById(deviceId); // Validar que el dispositivo existe
        
        List<Component> components = componentService.getComponentsByDevice(deviceId);
        return ResponseEntity.ok(componentService.toDTO(components));
    }

    /**
     * Crear un nuevo componente para un dispositivo
     */
    @PostMapping
    public ResponseEntity<ComponentDTO> createComponent(
            @PathVariable Long deviceId,
            @RequestBody ComponentDTO componentDTO) {
        
        Device device = deviceService.findById(deviceId);
        
        Component component = Component.builder()
                .device(device)
                .name(componentDTO.getName())
                .type(componentDTO.getType())
                .dataType(componentDTO.getDataType())
                .unit(componentDTO.getUnit())
                .minValue(componentDTO.getMinValue())
                .maxValue(componentDTO.getMaxValue())
                .description(componentDTO.getDescription())
                .build();

        Component savedComponent = componentService.createComponent(component);
        return ResponseEntity.status(HttpStatus.CREATED).body(componentService.toDTO(savedComponent));
    }

    /**
     * Actualizar un componente específico
     */
    @PutMapping("/{componentId}")
    public ResponseEntity<ComponentDTO> updateComponent(
            @PathVariable Long deviceId,
            @PathVariable Long componentId,
            @RequestBody ComponentDTO componentDTO) {
        
        deviceService.findById(deviceId); // Validar que el dispositivo existe
        
        Component componentToUpdate = Component.builder()
                .name(componentDTO.getName())
                .type(componentDTO.getType())
                .dataType(componentDTO.getDataType())
                .unit(componentDTO.getUnit())
                .minValue(componentDTO.getMinValue())
                .maxValue(componentDTO.getMaxValue())
                .description(componentDTO.getDescription())
                .build();

        Component updatedComponent = componentService.updateComponent(componentId, componentToUpdate);
        return ResponseEntity.ok(componentService.toDTO(updatedComponent));
    }

    /**
     * Eliminar un componente específico
     */
    @DeleteMapping("/{componentId}")
    public ResponseEntity<Void> deleteComponent(
            @PathVariable Long deviceId,
            @PathVariable Long componentId) {
        
        deviceService.findById(deviceId); // Validar que el dispositivo existe
        
        componentService.deleteComponent(componentId);
        return ResponseEntity.noContent().build();
    }
}
