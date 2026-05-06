package com.example.lms.files.service;

import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

public interface FileStorageService {
    FileResponse store(MultipartFile file, FileCategory category);

    StoredFile storeGenerated(String filename, String contentType, byte[] content, FileCategory category);

    Resource loadAsResource(Long fileId);

    String signedUrl(Long fileId, Duration ttl);

    StoredFile metadata(Long fileId);
}
