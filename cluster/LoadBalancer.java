import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A tiny, dependency-free reverse-proxy load balancer for the TalentAI backend
 * cluster. Pure JDK (no install), so it runs anywhere Java 17 does.
 *
 * <p>Round-robins across the given upstream instances, skipping any that fail
 * their health check (GET /api/actuator/health). Adds an {@code X-LB-Upstream}
 * response header naming the instance that served the request, and logs a
 * per-request line plus a running hit-count per upstream so you can SEE the
 * balancing happen.
 *
 * <p>This demonstrates the same shape as an nginx/HAProxy tier (see nginx.conf);
 * for production use the real thing. Usage:
 *   java LoadBalancer.java &lt;listenPort&gt; host:port [host:port ...]
 * e.g.
 *   java LoadBalancer.java 8080 127.0.0.1:8081 127.0.0.1:8082 127.0.0.1:8083
 */
public class LoadBalancer {

    // Hop-by-hop / restricted headers we must not copy verbatim (the client sets these itself).
    private static final Set<String> SKIP = Set.of(
            "host", "content-length", "connection", "keep-alive", "transfer-encoding",
            "upgrade", "expect", "te", "trailer", "proxy-connection");

    static final class Upstream {
        final String authority;                 // host:port
        final AtomicBoolean healthy = new AtomicBoolean(true);
        final AtomicLong hits = new AtomicLong();
        Upstream(String authority) { this.authority = authority; }
    }

    private static final List<Upstream> UPSTREAMS = new ArrayList<>();
    private static final AtomicInteger RR = new AtomicInteger();
    private static final HttpClient CLIENT = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(3))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();

    public static void main(String[] args) throws IOException {
        if (args.length < 2) {
            System.err.println("Usage: java LoadBalancer.java <listenPort> host:port [host:port ...]");
            System.exit(2);
        }
        int port = Integer.parseInt(args[0]);
        for (int i = 1; i < args.length; i++) UPSTREAMS.add(new Upstream(args[i]));

        startHealthChecks();

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newFixedThreadPool(64));
        server.createContext("/", LoadBalancer::handle);
        server.start();

        System.out.println("TalentAI load balancer listening on :" + port);
        System.out.println("Upstreams: " + args.length + " -> " + String.join(", ", argTail(args)));
        System.out.println("Health: GET /api/actuator/health every 5s. Ctrl+C to stop.\n");
    }

    private static List<String> argTail(String[] args) {
        List<String> t = new ArrayList<>();
        for (int i = 1; i < args.length; i++) t.add(args[i]);
        return t;
    }

    /** Picks the next healthy upstream in round-robin order; null if all are down. */
    private static Upstream next() {
        int n = UPSTREAMS.size();
        for (int i = 0; i < n; i++) {
            Upstream u = UPSTREAMS.get(Math.floorMod(RR.getAndIncrement(), n));
            if (u.healthy.get()) return u;
        }
        return null;
    }

    private static void handle(HttpExchange ex) throws IOException {
        long start = System.nanoTime();
        Upstream u = next();
        if (u == null) {
            respond(ex, 503, "{\"errorCode\":\"NO_HEALTHY_UPSTREAM\",\"message\":\"All backend instances are down.\"}", null);
            log(ex, "-", 503, start);
            return;
        }
        try {
            String rawPath = ex.getRequestURI().getRawPath();
            String rawQuery = ex.getRequestURI().getRawQuery();
            String target = "http://" + u.authority + rawPath + (rawQuery == null ? "" : "?" + rawQuery);

            byte[] body = ex.getRequestBody().readAllBytes();
            HttpRequest.Builder rb = HttpRequest.newBuilder(URI.create(target)).timeout(Duration.ofSeconds(30));
            String method = ex.getRequestMethod();
            rb.method(method, body.length == 0
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofByteArray(body));

            for (Map.Entry<String, List<String>> h : ex.getRequestHeaders().entrySet()) {
                String name = h.getKey();
                if (name == null || SKIP.contains(name.toLowerCase(Locale.ROOT))) continue;
                for (String v : h.getValue()) {
                    try { rb.header(name, v); } catch (IllegalArgumentException ignore) { /* restricted */ }
                }
            }

            HttpResponse<byte[]> resp = CLIENT.send(rb.build(), HttpResponse.BodyHandlers.ofByteArray());
            u.hits.incrementAndGet();

            resp.headers().map().forEach((name, values) -> {
                if (name == null || SKIP.contains(name.toLowerCase(Locale.ROOT))) return;
                for (String v : values) ex.getResponseHeaders().add(name, v);
            });
            ex.getResponseHeaders().set("X-LB-Upstream", u.authority);

            byte[] out = resp.body();
            ex.sendResponseHeaders(resp.statusCode(), out.length == 0 ? -1 : out.length);
            if (out.length > 0) try (OutputStream os = ex.getResponseBody()) { os.write(out); }
            log(ex, u.authority, resp.statusCode(), start);
        } catch (Exception e) {
            u.healthy.set(false); // fast-fail this upstream until the next health probe clears it
            respond(ex, 502, "{\"errorCode\":\"BAD_GATEWAY\",\"message\":\"Upstream " + u.authority + " failed.\"}", u.authority);
            log(ex, u.authority + " ERR:" + e.getClass().getSimpleName(), 502, start);
        }
    }

    private static void respond(HttpExchange ex, int status, String json, String upstream) throws IOException {
        byte[] b = json.getBytes();
        ex.getResponseHeaders().set("Content-Type", "application/json");
        if (upstream != null) ex.getResponseHeaders().set("X-LB-Upstream", upstream);
        ex.sendResponseHeaders(status, b.length);
        try (OutputStream os = ex.getResponseBody()) { os.write(b); }
    }

    private static void log(HttpExchange ex, String upstream, int status, long startNanos) {
        long ms = (System.nanoTime() - startNanos) / 1_000_000;
        StringBuilder tally = new StringBuilder();
        for (Upstream u : UPSTREAMS) {
            if (tally.length() > 0) tally.append(' ');
            tally.append(u.authority).append('=').append(u.hits.get()).append(u.healthy.get() ? "" : "(down)");
        }
        System.out.printf("%-6s %-40s -> %-22s %d  %dms   [%s]%n",
                ex.getRequestMethod(), ex.getRequestURI().getRawPath(), upstream, status, ms, tally);
    }

    private static void startHealthChecks() {
        Thread t = new Thread(() -> {
            while (true) {
                for (Upstream u : UPSTREAMS) {
                    try {
                        HttpResponse<Void> r = CLIENT.send(
                                HttpRequest.newBuilder(URI.create("http://" + u.authority + "/api/actuator/health"))
                                        .timeout(Duration.ofSeconds(2)).GET().build(),
                                HttpResponse.BodyHandlers.discarding());
                        boolean up = r.statusCode() == 200;
                        if (up != u.healthy.getAndSet(up)) {
                            System.out.println("[health] " + u.authority + " -> " + (up ? "UP" : "DOWN"));
                        }
                    } catch (Exception e) {
                        if (u.healthy.getAndSet(false)) System.out.println("[health] " + u.authority + " -> DOWN");
                    }
                }
                try { Thread.sleep(5000); } catch (InterruptedException e) { return; }
            }
        }, "lb-health");
        t.setDaemon(true);
        t.start();
    }
}
