package com.phoneshop.dto.response;

import lombok.*;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BrandResponse {
    private Long id;
    private String name;
    private String logo;
}
