package io.github.hienpham0344.stayfinder.common.response;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class ApiResponseContractTest {

    @Test
    void preservesMachineReadableStringCodesAlongsideThePublicResult() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setCode("SUCCESS");
        response.setMessage("Success");
        response.setResult("stay");

        assertEquals("SUCCESS", response.getCode());
        assertEquals("Success", response.getMessage());
        assertEquals("stay", response.getResult());
    }
}
