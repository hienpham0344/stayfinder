package io.github.hienpham0344.stayfinder.admin.controller;

import io.github.hienpham0344.stayfinder.admin.dto.AdminDtos.*;
import io.github.hienpham0344.stayfinder.admin.service.AdminService;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service=service; }
    @GetMapping("/users") public ApiResponse<Page<Account>> accounts(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size,@RequestParam(required=false)String role,@RequestParam(defaultValue="")String q) { return ApiResponse.success(service.accounts(page,size,role,q)); }
    @GetMapping("/users/{id}") public ApiResponse<Account> account(@PathVariable UUID id) { return ApiResponse.success(service.account(id)); }
    @PatchMapping("/users/{id}/access") public ApiResponse<Void> access(@PathVariable UUID id,@Valid @RequestBody AccessChange request) { service.access(CurrentUser.require().id(),id,request);return ApiResponse.success(null); }
    @GetMapping("/reports") public ApiResponse<Page<Report>> reports(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size) { return ApiResponse.success(service.reports(page,size)); }
    @PatchMapping("/reports/{id}") public ApiResponse<Void> report(@PathVariable UUID id,@Valid @RequestBody ReportChange request) { service.report(CurrentUser.require().id(),id,request);return ApiResponse.success(null); }
    @GetMapping("/accommodations") public ApiResponse<Page<Content>> accommodations(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size) { return ApiResponse.success(service.accommodations(page,size)); }
    @GetMapping("/accommodations/{id}") public ApiResponse<AccommodationDetail> accommodation(@PathVariable UUID id) { return ApiResponse.success(service.accommodation(id)); }
    @PatchMapping("/accommodations/{id}/moderation") public ApiResponse<Void> accommodation(@PathVariable UUID id,@Valid @RequestBody AccommodationChange request) { service.accommodation(CurrentUser.require().id(),id,request);return ApiResponse.success(null); }
    @GetMapping("/reviews") public ApiResponse<Page<Content>> reviews(@RequestParam(defaultValue="0")int page,@RequestParam(defaultValue="20")int size) { return ApiResponse.success(service.reviews(page,size)); }
    @PatchMapping("/reviews/{id}/moderation") public ApiResponse<Void> review(@PathVariable UUID id,@Valid @RequestBody ReviewChange request) { service.review(CurrentUser.require().id(),id,request);return ApiResponse.success(null); }
    @GetMapping("/settings") public ApiResponse<List<Setting>> settings() { return ApiResponse.success(service.settings()); }
    @PutMapping("/settings/{key}") public ApiResponse<Void> setting(@PathVariable SettingKey key,@Valid @RequestBody SettingChange request) { service.setting(CurrentUser.require().id(),key,request);return ApiResponse.success(null); }
}
