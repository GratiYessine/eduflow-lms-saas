package com.example.lms.files.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.mapper.FileMapper;
import com.example.lms.files.repository.StoredFileRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class LocalFileStorageServiceTest {

    @Mock StoredFileRepository storedFileRepository;
    @Mock FileMapper fileMapper;

    @Test
    void storeRejectsWrongMimeTypeForAvatar() {
        LocalFileStorageService service = new LocalFileStorageService(storedFileRepository, fileMapper, new FileValidationService(1024L));
        ReflectionTestUtils.setField(service, "storagePath", "target/test-uploads");
        MockMultipartFile file = new MockMultipartFile("file", "avatar.txt", "text/plain", "hello".getBytes());

        assertThatThrownBy(() -> service.store(file, FileCategory.AVATAR))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File type");
    }

    @Test
    void storeRejectsOversizedFile() {
        LocalFileStorageService service = new LocalFileStorageService(storedFileRepository, fileMapper, new FileValidationService(4L));
        ReflectionTestUtils.setField(service, "storagePath", "target/test-uploads");
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "large".getBytes());

        assertThatThrownBy(() -> service.store(file, FileCategory.AVATAR))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("too large");
    }
}
