package com.phoneshop.dto.request;

import lombok.*;

@Getter @Setter
public class CartItemRequest {
    private Long productId;
    private Integer quantity;
}
