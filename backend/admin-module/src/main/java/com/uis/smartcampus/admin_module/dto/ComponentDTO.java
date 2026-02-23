package com.uis.smartcampus.admin_module.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDTO {

    private Long id;
    private String name;
    private String type;
    private String dataType;
    private String unit;
    private Double minValue;
    private Double maxValue;
    private String description;
}
