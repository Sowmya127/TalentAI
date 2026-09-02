package com.talentai.auth.service;

import com.talentai.auth.dto.AuthResponse;
import com.talentai.auth.dto.LoginRequest;
import com.talentai.auth.dto.RegisterRequest;

public interface AuthService {

    Long register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
