package com.talentai.ai;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.Optional;

/**
 * Pulls plain text out of an uploaded resume file so it can be sent to an LLM.
 * PDF is supported via PDFBox (the common case). Word documents (.doc/.docx)
 * are not extracted here — callers fall back to the deterministic parse for
 * those — to avoid pulling in the heavier Apache POI stack.
 */
@Component
public class ResumeTextExtractor {

    private static final Logger log = LoggerFactory.getLogger(ResumeTextExtractor.class);

    /** Cap the text we forward to the model to keep token usage (and cost) bounded. */
    private static final int MAX_CHARS = 12_000;

    public Optional<String> extract(Path file, String fileName) {
        String name = fileName == null ? "" : fileName.toLowerCase();
        if (!name.endsWith(".pdf")) {
            return Optional.empty();
        }
        try (PDDocument document = PDDocument.load(file.toFile())) {
            String text = new PDFTextStripper().getText(document);
            if (text == null || text.isBlank()) {
                return Optional.empty();
            }
            if (text.length() > MAX_CHARS) {
                text = text.substring(0, MAX_CHARS);
            }
            return Optional.of(text);
        } catch (Exception e) {
            log.warn("Could not extract text from resume {}: {}", fileName, e.getMessage());
            return Optional.empty();
        }
    }
}
