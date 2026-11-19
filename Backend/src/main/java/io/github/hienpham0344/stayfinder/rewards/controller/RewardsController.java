package io.github.hienpham0344.stayfinder.rewards.controller;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos;
import io.github.hienpham0344.stayfinder.rewards.service.RewardsService;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/rewards")
public class RewardsController {
    private final RewardsService service;
    public RewardsController(RewardsService service) { this.service = service; }
    @GetMapping("/account") public ApiResponse<RewardDtos.Account> account() { return ApiResponse.success(service.account()); }
    @GetMapping("/history") public ApiResponse<Page<RewardDtos.Ledger>> history(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.success(service.history(page(page, size)));
    }
    @GetMapping("/catalog") public ApiResponse<Page<RewardDtos.Catalog>> catalog(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.success(service.catalog(page(page, size)));
    }
    @GetMapping("/vouchers") public ApiResponse<Page<RewardDtos.Voucher>> vouchers(@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return ApiResponse.success(service.vouchers(page(page, size)));
    }
    @PostMapping("/redeem") public ApiResponse<RewardDtos.Voucher> redeem(@Valid @RequestBody RewardDtos.Redeem request) { return ApiResponse.success(service.redeem(request)); }
    private Pageable page(int page, int size) { return PageRequest.of(Math.max(0,page), Math.min(100,Math.max(1,size)), Sort.by(Sort.Direction.DESC,"createdAt","id")); }
}
