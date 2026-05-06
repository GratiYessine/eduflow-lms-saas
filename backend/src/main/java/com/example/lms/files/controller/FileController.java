package com.example.lms.files.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.dto.FileSignedUrlResponse;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import com.example.lms.files.service.FileStorageService;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ApiResponse<FileResponse> upload(@RequestParam("file") MultipartFile file, @RequestParam FileCategory category) {
        return ApiResponse.success("File uploaded successfully", fileStorageService.store(file, category));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        StoredFile file = fileStorageService.metadata(id);
        if (!canDownload(file)) {
            throw new ForbiddenException("File belongs to another user");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getOriginalFilename() + "\"")
                .body(fileStorageService.loadAsResource(id));
    }

    @GetMapping("/{id}/signed-url")
    public ApiResponse<FileSignedUrlResponse> signedUrl(@PathVariable Long id) {
        StoredFile file = fileStorageService.metadata(id);
        if (!canDownload(file)) {
            throw new ForbiddenException("File belongs to another user");
        }
        Duration ttl = Duration.ofMinutes(10);
        return ApiResponse.success("Signed URL generated successfully",
                new FileSignedUrlResponse(fileStorageService.signedUrl(id, ttl), Instant.now().plus(ttl)));
    }

    private boolean canDownload(StoredFile file) {
        Role role = SecurityUtils.currentRole();
        Long currentUserId = SecurityUtils.currentUserId();
        return role == Role.SUPER_ADMIN || (file.getUploadedBy() != null && file.getUploadedBy().equals(currentUserId));
    }
}
