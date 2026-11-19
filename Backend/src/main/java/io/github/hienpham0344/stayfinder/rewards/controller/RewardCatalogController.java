package io.github.hienpham0344.stayfinder.rewards.controller;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos;
import io.github.hienpham0344.stayfinder.rewards.service.RewardCatalogService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController @RequestMapping("/api/admin/reward-catalog")
public class RewardCatalogController {
    private final RewardCatalogService service;
    public RewardCatalogController(RewardCatalogService service) { this.service = service; }
    @GetMapping public ApiResponse<Page<RewardDtos.Catalog>> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        return ApiResponse.success(service.list(PageRequest.of(Math.max(0,page),Math.min(100,Math.max(1,size)),Sort.by(Sort.Direction.DESC,"createdAt","id"))));
    }
    @PostMapping public ApiResponse<RewardDtos.Catalog> create(@Valid @RequestBody RewardDtos.CatalogRequest request) { return ApiResponse.success(service.create(request)); }
    @PutMapping("/{id}") public ApiResponse<RewardDtos.Catalog> update(@PathVariable UUID id,@Valid @RequestBody RewardDtos.CatalogRequest request) { return ApiResponse.success(service.update(id,request)); }
}
