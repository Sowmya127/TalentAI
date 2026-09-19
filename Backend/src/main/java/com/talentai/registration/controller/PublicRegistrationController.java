package com.talentai.registration.controller;

import com.talentai.config.CacheConfig;
import com.talentai.registration.dto.RegistrationDtos.RoleOption;
import com.talentai.user.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Unauthenticated: the roles offered on the public "Register as" form. Driven by
 * role.self_registerable, so System Admin is never returned. Whitelisted for GET
 * under /v1/public/** in SecurityConfig.
 */
@RestController
@RequestMapping("/v1/public")
@RequiredArgsConstructor
public class PublicRegistrationController {

    private final RoleRepository roleRepository;

    @GetMapping("/roles")
    @Cacheable(cacheNames = CacheConfig.REFERENCE_ROLES, key = "'selfRegisterable'")
    public ResponseEntity<List<RoleOption>> selfRegisterableRoles() {
        List<RoleOption> roles = roleRepository.findBySelfRegisterableTrueAndIsActiveTrueOrderByRoleIdAsc().stream()
                .map(r -> new RoleOption(r.getRoleName(), r.getDescription()))
                .toList();
        return ResponseEntity.ok(roles);
    }
}
