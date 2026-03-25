package com.phoneshop.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CouponResponse {
    private Long id;
    private String code;
    private String type;
    private BigDecimal value;
    private BigDecimal minOrder;
    private Integer maxUses;
    private Integer usedCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
}
