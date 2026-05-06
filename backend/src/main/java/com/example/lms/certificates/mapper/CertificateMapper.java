package com.example.lms.certificates.mapper;

import com.example.lms.certificates.dto.CertificateResponse;
import com.example.lms.certificates.entity.Certificate;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CertificateMapper {
    CertificateResponse toResponse(Certificate certificate);
}
