package com.example.lms.companies.controller;

import com.example.lms.common.dto.ApiResponse;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.companies.dto.CompanyCreateRequest;
import com.example.lms.companies.dto.CompanyResponse;
import com.example.lms.companies.dto.CompanyUpdateRequest;
import com.example.lms.companies.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @PostMapping
    public ApiResponse<CompanyResponse> create(@Valid @RequestBody CompanyCreateRequest request) {
        return ApiResponse.success("Company created successfully", companyService.create(request));
    }

    @GetMapping
    public ApiResponse<PageResponse<CompanyResponse>> list(
            @RequestParam(required = false) String q,
            Pageable pageable
    ) {
        return ApiResponse.success("Companies loaded successfully", companyService.list(q, pageable));
    }

    @GetMapping("/me")
    public ApiResponse<CompanyResponse> myCompany() {
        return ApiResponse.success("Company loaded successfully", companyService.myCompany());
    }

    @PutMapping("/{id}")
    public ApiResponse<CompanyResponse> update(@PathVariable Long id, @Valid @RequestBody CompanyUpdateRequest request) {
        return ApiResponse.success("Company updated successfully", companyService.update(id, request));
    }
}
