package com.example.lms.files.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.files.config.FileStorageProperties;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import com.example.lms.files.mapper.FileMapper;
import com.example.lms.files.repository.StoredFileRepository;
import com.example.lms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@ConditionalOnExpression("'${app.files.provider:local}' == 's3' || '${app.files.provider:local}' == 'minio'")
public class S3CompatibleFileStorageService implements FileStorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final FileStorageProperties properties;
    private final FileValidationService fileValidationService;
    private final StoredFileRepository storedFileRepository;
    private final FileMapper fileMapper;

    @Override
    @Transactional
    public FileResponse store(MultipartFile file, FileCategory category) {
        fileValidationService.validateUpload(file, category);
        String originalFilename = fileValidationService.sanitize(file.getOriginalFilename());
        String key = objectKey(category, originalFilename);
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket())
                    .key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return fileMapper.toResponse(persistMetadata(originalFilename, key, file.getContentType(), file.getSize(), category));
        } catch (IOException ex) {
            throw new BadRequestException("Could not upload file");
        }
    }

    @Override
    @Transactional
    public StoredFile storeGenerated(String filename, String contentType, byte[] content, FileCategory category) {
        fileValidationService.validateMetadata(filename, contentType, content.length, category);
        String originalFilename = fileValidationService.sanitize(filename);
        String key = objectKey(category, originalFilename);
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket())
                .key(key)
                .contentType(contentType)
                .contentLength((long) content.length)
                .build();
        s3Client.putObject(request, RequestBody.fromBytes(content));
        return persistMetadata(originalFilename, key, contentType, content.length, category);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadAsResource(Long fileId) {
        StoredFile stored = metadata(fileId);
        ResponseBytes<GetObjectResponse> object = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                .bucket(bucket())
                .key(stored.getStoredFilename())
                .build());
        return new ByteArrayResource(object.asByteArray());
    }

    @Override
    @Transactional(readOnly = true)
    public String signedUrl(Long fileId, Duration ttl) {
        StoredFile stored = metadata(fileId);
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket())
                .key(stored.getStoredFilename())
                .build();
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(getObjectRequest)
                .build();
        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    @Transactional(readOnly = true)
    public StoredFile metadata(Long fileId) {
        return storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    private StoredFile persistMetadata(String originalFilename, String key, String contentType, long size, FileCategory category) {
        StoredFile stored = new StoredFile();
        stored.setOriginalFilename(originalFilename);
        stored.setStoredFilename(key);
        stored.setContentType(contentType == null ? "application/octet-stream" : contentType);
        stored.setSize(size);
        stored.setCategory(category);
        stored.setStoragePath("s3://" + bucket() + "/" + key);
        stored.setUploadedBy(SecurityUtils.currentUserId());
        return storedFileRepository.save(stored);
    }

    private String objectKey(FileCategory category, String filename) {
        return category.name().toLowerCase() + "/" + UUID.randomUUID() + "-" + filename;
    }

    private String bucket() {
        String bucket = "minio".equals(properties.provider()) ? properties.minio().bucket() : properties.s3().bucket();
        if (bucket == null || bucket.isBlank()) {
            throw new BadRequestException("File storage bucket is not configured");
        }
        return bucket;
    }
}
