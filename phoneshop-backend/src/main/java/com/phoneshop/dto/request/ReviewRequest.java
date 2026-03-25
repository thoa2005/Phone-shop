package com.phoneshop.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
public class ReviewRequest {
    @NotNull private Long productId;
    private Long orderId;
    @NotNull @Min(1) @Max(5) private Integer rating;
    private String comment;
}
