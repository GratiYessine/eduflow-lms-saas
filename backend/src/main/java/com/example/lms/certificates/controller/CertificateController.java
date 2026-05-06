package com.example.lms.certificates.controller;

import com.example.lms.certificates.dto.CertificateResponse;
import com.example.lms.certificates.dto.CertificateVerificationResponse;
import com.example.lms.certificates.entity.Certificate;
import com.example.lms.certificates.service.CertificateService;
import com.example.lms.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/certificates")
@RequiredArgsConstructor
public class CertificateController {

    private final CertificateService certificateService;

    @PostMapping("/generate/{progressId}")
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public ApiResponse<CertificateResponse> generate(@PathVariable Long progressId) {
        return ApiResponse.success("Certificate generated successfully", certificateService.generate(progressId));
    }

    @GetMapping("/my")
    public ApiResponse<List<CertificateResponse>> myCertificates() {
        return ApiResponse.success("Certificates loaded successfully", certificateService.myCertificates());
    }

    @GetMapping("/verify/{code}")
    public ApiResponse<CertificateVerificationResponse> verify(@PathVariable String code) {
        return ApiResponse.success("Certificate verification completed", certificateService.verify(code));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Certificate certificate = certificateService.certificateForDownload(id);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + certificate.getCertificateNumber() + ".pdf\"")
                .body(certificateService.download(id));
    }
}
