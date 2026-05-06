package com.example.lms.files.mapper;

import com.example.lms.files.dto.FileResponse;
import com.example.lms.files.entity.StoredFile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FileMapper {
    @Mapping(target = "url", expression = "java(\"/api/v1/files/\" + storedFile.getId())")
    FileResponse toResponse(StoredFile storedFile);
}
