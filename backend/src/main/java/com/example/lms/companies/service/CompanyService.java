package com.example.lms.companies.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.dto.PageResponse;
import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.companies.dto.CompanyCreateRequest;
import com.example.lms.companies.dto.CompanyResponse;
import com.example.lms.companies.dto.CompanyUpdateRequest;
import com.example.lms.companies.entity.Company;
import com.example.lms.companies.mapper.CompanyMapper;
import com.example.lms.companies.repository.CompanyRepository;
import com.example.lms.security.SecurityUtils;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;

    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PageResponse<CompanyResponse> list(String query, Pageable pageable) {
        Specification<Company> spec = (root, cq, cb) -> cb.conjunction();
        String cleanedQuery = query == null ? null : query.trim();
        if (cleanedQuery != null && !cleanedQuery.isBlank()) {
            String term = "%" + cleanedQuery.toLowerCase() + "%";
            spec = spec.and((root, cq, cb) -> cb.or(
                    cb.like(cb.lower(root.get("name")), term),
                    cb.like(cb.lower(root.get("industry")), term)
            ));
        }
        return PageResponse.from(companyRepository.findAll(spec, pageable).map(companyMapper::toResponse));
    }

    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public CompanyResponse create(CompanyCreateRequest request) {
        if (companyRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Company name is already used");
        }
        Company company = new Company();
        company.setName(request.name().trim());
        company.setIndustry(request.industry());
        company.setWebsite(request.website());
        company.setLogoUrl(request.logoUrl());
        company.setSize(request.size());
        return companyMapper.toResponse(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "companies", key = "'my:' + T(com.example.lms.security.SecurityUtils).currentCompanyId()")
    public CompanyResponse myCompany() {
        Long companyId = SecurityUtils.currentCompanyId();
        if (companyId == null) {
            throw new BadRequestException("Current user is not attached to a company");
        }
        return companyMapper.toResponse(companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found")));
    }

    @Transactional
    @CacheEvict(value = "companies", allEntries = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or (hasRole('COMPANY_ADMIN') and @tenantSecurity.hasCompanyAccess(#id))")
    public CompanyResponse update(Long id, CompanyUpdateRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        if (request.name() != null && !request.name().equalsIgnoreCase(company.getName())) {
            if (companyRepository.existsByNameIgnoreCase(request.name())) {
                throw new DuplicateResourceException("Company name is already used");
            }
            company.setName(request.name().trim());
        }
        company.setIndustry(request.industry());
        company.setWebsite(request.website());
        company.setLogoUrl(request.logoUrl());
        company.setSize(request.size());
        if (SecurityUtils.currentRole() != Role.SUPER_ADMIN && !id.equals(SecurityUtils.currentCompanyId())) {
            throw new BadRequestException("Invalid company context");
        }
        return companyMapper.toResponse(company);
    }
}
