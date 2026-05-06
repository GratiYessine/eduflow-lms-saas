package com.example.lms.files.dto;

import com.example.lms.files.entity.FileCategory;

public record FileResponse(
        Long id,
        String originalFilename,
        String contentType,
        long size,
        FileCategory category,
        String url
) {
}
