package io.github.hienpham0344.stayfinder.reward.controller;
import io.github.hienpham0344.stayfinder.reward.dto.*;
import io.github.hienpham0344.stayfinder.reward.service.RewardService;
import io.github.hienpham0344.stayfinder.common.response.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
@RestController @RequestMapping("/api/rewards")
public class RewardController {
 private final RewardService service;public RewardController(RewardService service){this.service=service;}
 @GetMapping("/wallet") public ResponseEntity<ApiResponse<RewardWalletResponse>> wallet(){return ResponseEntity.ok(ApiResponse.success(service.wallet(CurrentUser.require().id())));}
 @GetMapping("/catalog") public ResponseEntity<ApiResponse<List<RewardOfferResponse>>> catalog(){return ResponseEntity.ok(ApiResponse.success(service.catalog(CurrentUser.require().id())));}
 @GetMapping("/history") public ResponseEntity<ApiResponse<PageResponse<RewardHistoryResponse>>> history(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
  return ResponseEntity.ok(ApiResponse.success(service.history(CurrentUser.require().id(),pageable(page,size))));
 }
 @GetMapping("/claims") public ResponseEntity<ApiResponse<PageResponse<RewardClaimResponse>>> claims(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
  return ResponseEntity.ok(ApiResponse.success(service.claims(CurrentUser.require().id(),pageable(page,size))));
 }
 @PostMapping("/claims") public ResponseEntity<ApiResponse<RewardClaimResponse>> claim(@RequestHeader("Idempotency-Key") String key,@Valid @RequestBody RewardClaimRequest request){
  return ResponseEntity.ok(ApiResponse.success(service.claim(CurrentUser.require().id(),request.offerId(),key)));
 }
 private static PageRequest pageable(int page,int size){if(page<0||size<1||size>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);return PageRequest.of(page,size);}
}
