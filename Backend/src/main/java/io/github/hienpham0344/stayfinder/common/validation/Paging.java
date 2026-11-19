package io.github.hienpham0344.stayfinder.common.validation;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public final class Paging {
    private Paging() { }
    public static PageRequest newest(int page, int size) {
        return PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)),
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")));
    }
}
