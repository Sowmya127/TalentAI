package com.talentai.auth.service;

import com.talentai.auth.dto.AuthResponse;
import com.talentai.auth.dto.LoginRequest;
import com.talentai.auth.dto.RegisterRequest;
import com.talentai.registration.dto.RegistrationDtos.RegistrationResult;

public interface AuthService {

    RegistrationResult register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
