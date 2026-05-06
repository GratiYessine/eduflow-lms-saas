package com.example.lms.files.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.files.entity.FileCategory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

@Component
public class FileValidationService {

    private static final Map<FileCategory, Set<String>> ALLOWED_CONTENT_TYPES = Map.of(
            FileCategory.AVATAR, Set.of("image/jpeg", "image/png", "image/webp"),
            FileCategory.COMPANY_LOGO, Set.of("image/jpeg", "image/png", "image/webp"),
            FileCategory.TRAINING_THUMBNAIL, Set.of("image/jpeg", "image/png", "image/webp"),
            FileCategory.VIDEO, Set.of("video/mp4", "video/webm", "video/quicktime"),
            FileCategory.CERTIFICATE, Set.of("application/pdf"),
            FileCategory.OTHER, Set.of("application/pdf", "image/jpeg", "image/png", "image/webp", "text/plain")
    );

    private static final Map<FileCategory, Set<String>> ALLOWED_EXTENSIONS = Map.of(
            FileCategory.AVATAR, Set.of("jpg", "jpeg", "png", "webp"),
            FileCategory.COMPANY_LOGO, Set.of("jpg", "jpeg", "png", "webp"),
            FileCategory.TRAINING_THUMBNAIL, Set.of("jpg", "jpeg", "png", "webp"),
            FileCategory.VIDEO, Set.of("mp4", "webm", "mov"),
            FileCategory.CERTIFICATE, Set.of("pdf"),
            FileCategory.OTHER, Set.of("pdf", "jpg", "jpeg", "png", "webp", "txt")
    );

    private final long maxSizeBytes;

    public FileValidationService(@Value("${app.files.max-size-bytes:10485760}") long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public void validateUpload(MultipartFile file, FileCategory category) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        validateMetadata(file.getOriginalFilename(), file.getContentType(), file.getSize(), category);
    }

    public void validateMetadata(String filename, String contentType, long size, FileCategory category) {
        if (size > maxSizeBytes) {
            throw new BadRequestException("File is too large");
        }
        if (size < 0) {
            throw new BadRequestException("Invalid file size");
        }
        if (contentType == null || !ALLOWED_CONTENT_TYPES.getOrDefault(category, Set.of()).contains(contentType.toLowerCase())) {
            throw new BadRequestException("File type is not allowed for category " + category);
        }
        String extension = extension(sanitize(filename));
        if (extension.isBlank() || !ALLOWED_EXTENSIONS.getOrDefault(category, Set.of()).contains(extension)) {
            throw new BadRequestException("File extension is not allowed for category " + category);
        }
    }

    public String sanitize(String filename) {
        String value = filename == null || filename.isBlank() ? "file" : Path.of(filename).getFileName().toString();
        return value.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String extension(String filename) {
        int index = filename.lastIndexOf('.');
        return index < 0 ? "" : filename.substring(index + 1).toLowerCase();
    }
}
