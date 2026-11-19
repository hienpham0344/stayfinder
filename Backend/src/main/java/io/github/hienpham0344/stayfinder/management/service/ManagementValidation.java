package io.github.hienpham0344.stayfinder.management.service;

import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

public final class ManagementValidation {
    private ManagementValidation() { }

    public static void version(Long expected, long actual) {
        if (expected == null) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        if (expected != actual) throw new BusinessException(ErrorCode.CONCURRENT_UPDATE);
    }

    public static void money(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 0
                || amount.compareTo(new BigDecimal("9999999999999999")) > 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        }
    }

    public static void imageUrls(List<String> urls) {
        if (urls == null || urls.size() > 20) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        for (String url : urls) {
            try {
                URI uri = URI.create(url);
                if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null
                        || url.length() > 2000) throw new IllegalArgumentException();
            } catch (IllegalArgumentException | NullPointerException exception) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            }
        }
    }
}
