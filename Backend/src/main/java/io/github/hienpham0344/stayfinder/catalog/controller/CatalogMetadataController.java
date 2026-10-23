package io.github.hienpham0344.stayfinder.catalog.controller;
import io.github.hienpham0344.stayfinder.catalog.dto.*;
import io.github.hienpham0344.stayfinder.catalog.service.CatalogMetadataService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api")
public class CatalogMetadataController {
    private final CatalogMetadataService metadata;
    public CatalogMetadataController(CatalogMetadataService metadata){this.metadata=metadata;}
    @GetMapping("/catalog/filters")
    public ResponseEntity<ApiResponse<CatalogFiltersResponse>> filters(){return ResponseEntity.ok(ApiResponse.success(metadata.filters()));}
    @GetMapping("/locations/suggestions")
    public ResponseEntity<ApiResponse<List<LocationDto>>> suggestions(@RequestParam(defaultValue="") String q){
        return ResponseEntity.ok(ApiResponse.success(metadata.suggestions(q)));
    }
}
