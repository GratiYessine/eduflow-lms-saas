package com.example.lms.companies.mapper;

import com.example.lms.companies.dto.CompanyResponse;
import com.example.lms.companies.entity.Company;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CompanyMapper {
    CompanyResponse toResponse(Company company);
}
