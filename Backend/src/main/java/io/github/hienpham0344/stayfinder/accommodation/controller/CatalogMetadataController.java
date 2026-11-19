package io.github.hienpham0344.stayfinder.accommodation.controller;

import io.github.hienpham0344.stayfinder.accommodation.service.CatalogMetadataService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CatalogMetadataController {
    private final CatalogMetadataService service;
    public CatalogMetadataController(CatalogMetadataService service) { this.service = service; }
    @GetMapping("/api/accommodations/metadata")
    public ApiResponse<CatalogMetadataService.Metadata> get() { return ApiResponse.success(service.get()); }
}
