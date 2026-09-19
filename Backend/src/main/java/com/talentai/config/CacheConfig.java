package com.talentai.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * In-process caching (Caffeine) for read-mostly data, so hot read paths don't hit
 * MySQL on every request. Two named caches with different lifetimes:
 *
 * <ul>
 *   <li>{@code REFERENCE_ROLES} — the self-registerable role list on the public
 *       registration form. Reference data that changes rarely; longer TTL.</li>
 *   <li>{@code DASHBOARD} — recruitment aggregate counts. A short TTL keeps the
 *       figures fresh enough for a dashboard while collapsing repeated COUNT
 *       queries under load.</li>
 * </ul>
 *
 * Entity objects are never cached (only DTOs/primitives), so there is no
 * detached-entity or staleness hazard on the write paths.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String REFERENCE_ROLES = "referenceRoles";
    public static final String DASHBOARD = "dashboard";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager();
        manager.setAllowNullValues(false);
        // Register the custom (per-cache TTL) caches BEFORE fixing the names, so
        // setCacheNames picks up these specs rather than building defaults.
        manager.registerCustomCache(REFERENCE_ROLES, Caffeine.newBuilder()
                .maximumSize(64)
                .expireAfterWrite(Duration.ofMinutes(10))
                .build());
        manager.registerCustomCache(DASHBOARD, Caffeine.newBuilder()
                .maximumSize(256)
                .expireAfterWrite(Duration.ofSeconds(30))
                .build());
        // Fixed set of caches; anything else is disallowed so a typo'd cache name fails fast.
        manager.setCacheNames(java.util.List.of(REFERENCE_ROLES, DASHBOARD));
        return manager;
    }
}
