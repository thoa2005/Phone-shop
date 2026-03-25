package com.phoneshop.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter
public class OrderRequest {
    @NotNull private Long addressId;
    private String couponCode;
    @NotBlank private String paymentMethod;
    private String note;
    private List<OrderItemRequest> items;

    @Getter @Setter
    public static class OrderItemRequest {
        @NotNull private Long productId;
        @NotNull @Min(1) private Integer quantity;
    }
}
