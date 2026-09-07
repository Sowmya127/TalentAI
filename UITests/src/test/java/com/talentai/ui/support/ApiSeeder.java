package com.talentai.ui.support;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Seeds test accounts straight through the backend REST API so the login tests
 * have a known candidate to authenticate with, without depending on the
 * registration UI. Registration is idempotent for our purposes: 201 = created,
 * 409 = already exists — both are fine.
 */
public final class ApiSeeder {

    private static final HttpClient CLIENT = HttpClient.newHttpClient();

    private ApiSeeder() {
    }

    /** Registers a candidate via POST {apiUrl}/auth/register. Returns the HTTP status. */
    public static int registerCandidate(String apiUrl, String firstName, String lastName, String email, String password) {
        String json = String.format(
                "{\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"password\":\"%s\"}",
                firstName, lastName, email, password);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        try {
            HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed candidate via API at " + apiUrl
                    + " — is the backend running? " + e.getMessage(), e);
        }
    }
}
