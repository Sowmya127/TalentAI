package com.talentai.candidate.integration.support;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

/**
 * Mints JWTs for integration tests, signed with the SAME secret the running
 * application verifies against (see {@code JwtTokenProvider}). The app's
 * {@code JwtAuthenticationFilter} only needs a signature-valid token whose
 * subject is a real user id — it reloads the user's authorities from the
 * database — so tests never depend on the token's role claims.
 */
public final class JwtTestFactory {

    private JwtTestFactory() {
    }

    private static SecretKey key(String secret) {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** A well-formed, currently-valid token for the given user id. */
    public static String validToken(long userId, String secret, long expirationMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", "it@test.local")
                .claim("roles", List.of())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key(secret))
                .compact();
    }

    /** A correctly-signed token whose expiry is in the past. */
    public static String expiredToken(long userId, String secret) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(new Date(now - 7_200_000L))
                .expiration(new Date(now - 3_600_000L))
                .signWith(key(secret))
                .compact();
    }
}
