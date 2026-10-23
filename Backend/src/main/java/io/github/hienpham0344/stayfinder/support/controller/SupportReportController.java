package io.github.hienpham0344.stayfinder.support.controller;import io.github.hienpham0344.stayfinder.support.service.SupportReportService;import io.github.hienpham0344.stayfinder.support.dto.*;import io.github.hienpham0344.stayfinder.security.CurrentUser;import io.github.hienpham0344.stayfinder.common.response.ApiResponse;import jakarta.validation.Valid;import org.springframework.web.bind.annotation.*;import org.springframework.http.ResponseEntity;
@RestController @RequestMapping("/api/support/reports")public class SupportReportController{
 private final SupportReportService service;public SupportReportController(SupportReportService service){this.service=service;}
 @PostMapping public ResponseEntity<ApiResponse<SupportReportResponse>> submit(@RequestHeader(value="Idempotency-Key",required=false)String key,@Valid @RequestBody SupportReportRequest request){return ResponseEntity.ok(ApiResponse.success(service.submit(CurrentUser.require().id(),request,key)));}
}
