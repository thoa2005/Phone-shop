package com.phoneshop.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
public class CouponRequest {
    @NotBlank private String code;
    @NotBlank private String type;
    @NotNull @DecimalMin("0") private BigDecimal value;
    private BigDecimal minOrder = BigDecimal.ZERO;
    private Integer maxUses;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive = true;
}
