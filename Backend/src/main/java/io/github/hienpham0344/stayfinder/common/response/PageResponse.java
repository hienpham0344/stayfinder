package io.github.hienpham0344.stayfinder.common.response;

import org.springframework.data.domain.Page;
import java.util.List;

public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    public PageResponse {
        items = List.copyOf(items);
        if (page < 0 || size < 1 || size > 100 || totalElements < 0 || totalPages < 0 || items.size() > size) {
            throw new IllegalArgumentException("Invalid public pagination metadata");
        }
    }
    public static <T> PageResponse<T> from(Page<T> source) {
        int size = source.getSize() == 0 ? 20 : source.getSize();
        long pages = source.getTotalElements() == 0 ? 0 : (source.getTotalElements() - 1) / size + 1;
        return new PageResponse<>(source.getContent(), source.getNumber(), size,
                source.getTotalElements(), Math.toIntExact(pages));
    }
}
