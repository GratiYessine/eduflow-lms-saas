package com.example.lms.teams.mapper;

import com.example.lms.teams.dto.TeamMemberResponse;
import com.example.lms.teams.dto.TeamResponse;
import com.example.lms.teams.entity.Team;
import com.example.lms.teams.entity.TeamMember;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TeamMapper {
    @Mapping(target = "members", expression = "java(java.util.List.of())")
    TeamResponse toResponse(Team team);

    @Mapping(target = "firstName", ignore = true)
    @Mapping(target = "lastName", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "status", ignore = true)
    TeamMemberResponse toResponse(TeamMember member);
}
