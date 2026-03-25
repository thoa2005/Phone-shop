package com.phoneshop.service;

import com.phoneshop.dto.request.LoginRequest;
import com.phoneshop.dto.request.RegisterRequest;
import com.phoneshop.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
}
