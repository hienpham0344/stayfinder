package io.github.hienpham0344.stayfinder.user.mapper;

import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toResponse(User entity);
}
