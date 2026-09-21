package io.github.hienpham0344.stayfinder.common.response;

import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApiResponse<T> {
    String code;
    String message;
    T result;

    public ApiResponse() {
    }

    public ApiResponse(String code, String message, T result) {
        this.code = code;
        this.message = message;
        this.result = result;
    }

    public static <T> ApiResponse<T> success(T result) {
        return new ApiResponse<>(ErrorCode.SUCCESS.getCode(), ErrorCode.SUCCESS.getMessage(), result);
    }
}
