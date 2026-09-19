package com.talentai.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.client.config.ClientOverrideConfiguration;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.ContentBlock;
import software.amazon.awssdk.services.bedrockruntime.model.ConversationRole;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseRequest;
import software.amazon.awssdk.services.bedrockruntime.model.ConverseResponse;
import software.amazon.awssdk.services.bedrockruntime.model.InferenceConfiguration;
import software.amazon.awssdk.services.bedrockruntime.model.Message;

import java.time.Duration;
import java.util.Optional;

/**
 * Thin wrapper over Amazon Bedrock's <b>Converse</b> API. Converse gives one
 * model-agnostic request/response shape, so the same code works across Amazon
 * Titan / Nova, Anthropic Claude, Meta Llama, Mistral, etc. — switching models
 * is just a change to {@code ai.bedrock.model-id}, no code change.
 *
 * <p>Every call is best-effort: when Bedrock is disabled or the request fails
 * for any reason (no credentials, model access not granted, throttling, timeout,
 * malformed output), the methods return an empty {@link Optional} so callers
 * transparently fall back to the deterministic logic. The application therefore
 * never breaks because of the AI layer.
 *
 * <p>Credentials are resolved via the default AWS provider chain — in production
 * that is the EC2 instance role; locally it is the usual
 * {@code ~/.aws/credentials} / environment variables. No secrets live in config.
 *
 * <p>The system instruction is folded into the user turn rather than sent as a
 * Converse {@code system} block, because not every model supports system prompts
 * (e.g. Titan Text); merging keeps one code path portable across all of them.
 */
@Service
public class BedrockService {

    private static final Logger log = LoggerFactory.getLogger(BedrockService.class);

    private final boolean enabled;
    private final String region;
    private final String modelId;
    private final int maxTokens;
    private final long timeoutMs;
    private final ObjectMapper mapper = new ObjectMapper();

    /** Built lazily on first use so a disabled deployment never touches the AWS SDK. */
    private volatile BedrockRuntimeClient client;

    public BedrockService(
            @Value("${ai.bedrock.enabled:false}") boolean enabled,
            @Value("${ai.bedrock.region:ap-south-1}") String region,
            @Value("${ai.bedrock.model-id:apac.amazon.nova-lite-v1:0}") String modelId,
            @Value("${ai.bedrock.max-tokens:1024}") int maxTokens,
            @Value("${ai.bedrock.timeout-ms:20000}") long timeoutMs) {
        this.enabled = enabled;
        this.region = region;
        this.modelId = modelId;
        this.maxTokens = maxTokens;
        this.timeoutMs = timeoutMs;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Sends a single-turn prompt to the configured model via Converse and returns
     * the concatenated text of the response, or empty on any failure.
     */
    public Optional<String> complete(String systemPrompt, String userPrompt) {
        if (!enabled) {
            return Optional.empty();
        }
        try {
            String text = (systemPrompt == null || systemPrompt.isBlank())
                    ? nullToEmpty(userPrompt)
                    : systemPrompt + "\n\n" + nullToEmpty(userPrompt);

            Message message = Message.builder()
                    .role(ConversationRole.USER)
                    .content(ContentBlock.fromText(text))
                    .build();

            ConverseResponse response = client().converse(ConverseRequest.builder()
                    .modelId(modelId)
                    .messages(message)
                    .inferenceConfig(InferenceConfiguration.builder()
                            .maxTokens(maxTokens)
                            .temperature(0.2f)
                            .build())
                    .build());

            StringBuilder sb = new StringBuilder();
            if (response.output() != null && response.output().message() != null) {
                for (ContentBlock block : response.output().message().content()) {
                    if (block.text() != null) {
                        sb.append(block.text());
                    }
                }
            }
            if (sb.length() == 0) {
                log.warn("Bedrock Converse returned no text content (model {})", modelId);
                return Optional.empty();
            }
            return Optional.of(sb.toString());
        } catch (Exception e) {
            log.warn("Bedrock Converse failed (model {}, region {}); falling back to deterministic logic: {}",
                    modelId, region, e.toString());
            return Optional.empty();
        }
    }

    /**
     * Like {@link #complete} but parses the model's reply as JSON. Tolerant of
     * models that wrap JSON in prose or ```json fences.
     */
    public Optional<JsonNode> completeJson(String systemPrompt, String userPrompt) {
        return complete(systemPrompt, userPrompt).flatMap(text -> {
            try {
                return Optional.of(mapper.readTree(extractJson(text)));
            } catch (Exception e) {
                log.warn("Bedrock returned non-JSON output: {}", e.getMessage());
                return Optional.empty();
            }
        });
    }

    /** Best-effort extraction of the first JSON object/array from a model reply. */
    static String extractJson(String text) {
        if (text == null) {
            return "";
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private BedrockRuntimeClient client() {
        BedrockRuntimeClient c = client;
        if (c == null) {
            synchronized (this) {
                c = client;
                if (c == null) {
                    c = BedrockRuntimeClient.builder()
                            .region(Region.of(region))
                            .credentialsProvider(DefaultCredentialsProvider.create())
                            .httpClientBuilder(UrlConnectionHttpClient.builder())
                            .overrideConfiguration(ClientOverrideConfiguration.builder()
                                    .apiCallTimeout(Duration.ofMillis(timeoutMs))
                                    .build())
                            .build();
                    client = c;
                }
            }
        }
        return c;
    }

    @PreDestroy
    void close() {
        if (client != null) {
            client.close();
        }
    }
}
