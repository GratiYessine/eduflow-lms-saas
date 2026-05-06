package com.example.lms.files.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import com.example.lms.files.mapper.FileMapper;
import com.example.lms.files.repository.StoredFileRepository;
import com.example.lms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Objects;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.files.provider", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private final StoredFileRepository storedFileRepository;
    private final FileMapper fileMapper;
    private final FileValidationService fileValidationService;

    @Value("${app.files.storage-path:./uploads}")
    private String storagePath;

    @Override
    @Transactional
    public FileResponse store(MultipartFile file, FileCategory category) {
        fileValidationService.validateUpload(file, category);
        try {
            Path root = ensureRoot(category);
            String safeOriginal = fileValidationService.sanitize(file.getOriginalFilename());
            String storedName = UUID.randomUUID() + "-" + safeOriginal;
            Path target = root.resolve(storedName).normalize();
            ensureInsideRoot(root, target);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            StoredFile stored = persistMetadata(safeOriginal, storedName, file.getContentType(), file.getSize(), category, target);
            return fileMapper.toResponse(stored);
        } catch (IOException ex) {
            throw new BadRequestException("Could not store file");
        }
    }

    @Override
    @Transactional
    public StoredFile storeGenerated(String filename, String contentType, byte[] content, FileCategory category) {
        fileValidationService.validateMetadata(filename, contentType, content.length, category);
        try {
            Path root = ensureRoot(category);
            String safeOriginal = fileValidationService.sanitize(filename);
            String storedName = UUID.randomUUID() + "-" + safeOriginal;
            Path target = root.resolve(storedName).normalize();
            ensureInsideRoot(root, target);
            Files.write(target, content);
            return persistMetadata(safeOriginal, storedName, contentType, content.length, category, target);
        } catch (IOException ex) {
            throw new BadRequestException("Could not store generated file");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Resource loadAsResource(Long fileId) {
        StoredFile stored = metadata(fileId);
        try {
            Resource resource = new UrlResource(Path.of(stored.getStoragePath()).toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
            throw new ResourceNotFoundException("File content not found");
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File content not found");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String signedUrl(Long fileId, Duration ttl) {
        StoredFile stored = metadata(fileId);
        return "/api/v1/files/" + Objects.requireNonNull(stored.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public StoredFile metadata(Long fileId) {
        return storedFileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));
    }

    private StoredFile persistMetadata(String originalFilename, String storedName, String contentType, long size, FileCategory category, Path target) {
        StoredFile stored = new StoredFile();
        stored.setOriginalFilename(originalFilename);
        stored.setStoredFilename(storedName);
        stored.setContentType(contentType == null ? "application/octet-stream" : contentType);
        stored.setSize(size);
        stored.setCategory(category);
        stored.setStoragePath(target.toString());
        stored.setUploadedBy(SecurityUtils.currentUserId());
        return storedFileRepository.save(stored);
    }

    private Path ensureRoot(FileCategory category) throws IOException {
        Path root = Path.of(storagePath, category.name().toLowerCase()).toAbsolutePath().normalize();
        Files.createDirectories(root);
        return root;
    }

    private void ensureInsideRoot(Path root, Path target) {
        if (!target.toAbsolutePath().normalize().startsWith(root.toAbsolutePath().normalize())) {
            throw new BadRequestException("Invalid file path");
        }
    }
}
