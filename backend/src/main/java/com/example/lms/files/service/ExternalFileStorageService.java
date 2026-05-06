package com.example.lms.files.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

@Service
@ConditionalOnProperty(name = "app.files.provider", havingValue = "external-placeholder")
public class ExternalFileStorageService implements FileStorageService {

    @Override
    public FileResponse store(MultipartFile file, FileCategory category) {
        throw notConfigured();
    }

    @Override
    public StoredFile storeGenerated(String filename, String contentType, byte[] content, FileCategory category) {
        throw notConfigured();
    }

    @Override
    public Resource loadAsResource(Long fileId) {
        throw notConfigured();
    }

    @Override
    public String signedUrl(Long fileId, Duration ttl) {
        throw notConfigured();
    }

    @Override
    public StoredFile metadata(Long fileId) {
        throw notConfigured();
    }

    private BadRequestException notConfigured() {
        return new BadRequestException("External file storage provider is not configured. Set provider-specific implementation for S3, MinIO or Cloudinary.");
    }
}
