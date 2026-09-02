package com.talentai.auth.dto;

import java.util.List;

/** "role" kept singular to match the shape already published in the
 *  TalentAI API Specification; "roles" added alongside it since a user
 *  can hold more than one role and the frontend needs the full set for
 *  authorization decisions. */
public record AuthResponse(String token, String role, List<String> roles, long expiresIn) {
}
