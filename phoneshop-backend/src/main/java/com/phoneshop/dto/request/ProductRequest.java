package com.phoneshop.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
public class ProductRequest {
    @NotBlank
    private String name;
    @NotBlank
    private String slug;
    private String description;
    @NotNull
    private Long categoryId;
    @NotNull
    private Long brandId;
    @NotNull @DecimalMin("0")
    private BigDecimal price;
    private BigDecimal salePrice;
    @NotNull @Min(0)
    private Integer stock;
    private Boolean isActive = true;
    private List<String> imageUrls;
    private String primaryImageUrl;
    private List<SpecItem> specs;

    @Getter @Setter
    public static class SpecItem {
        private String specName;
        private String specValue;
    }
}
