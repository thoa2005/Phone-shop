package com.phoneshop.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
public class AddressRequest {
    @NotBlank private String fullName;
    @NotBlank private String phone;
    @NotBlank private String province;
    @NotBlank private String district;
    @NotBlank private String ward;
    private String detail;
    private Boolean isDefault = false;
}
