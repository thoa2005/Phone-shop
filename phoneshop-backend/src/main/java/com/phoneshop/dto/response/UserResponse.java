package com.phoneshop.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String avatar;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
