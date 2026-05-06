package com.example.lms.companies.service;

import com.example.lms.common.exception.DuplicateResourceException;
import com.example.lms.companies.dto.CompanyCreateRequest;
import com.example.lms.companies.mapper.CompanyMapper;
import com.example.lms.companies.repository.CompanyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock CompanyRepository companyRepository;
    @Mock CompanyMapper companyMapper;
    @InjectMocks CompanyService companyService;

    @Test
    void createRejectsDuplicateCompanyName() {
        CompanyCreateRequest request = new CompanyCreateRequest("Acme", "Tech", null, null, "50");
        when(companyRepository.existsByNameIgnoreCase("Acme")).thenReturn(true);

        assertThatThrownBy(() -> companyService.create(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Company name");
    }
}
