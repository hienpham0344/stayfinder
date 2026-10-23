package io.github.hienpham0344.stayfinder.user.controller;import io.github.hienpham0344.stayfinder.user.service.UserPreferencesService;import io.github.hienpham0344.stayfinder.user.dto.*;import io.github.hienpham0344.stayfinder.security.CurrentUser;import io.github.hienpham0344.stayfinder.common.response.ApiResponse;import jakarta.validation.Valid;import org.springframework.web.bind.annotation.*;import org.springframework.http.ResponseEntity;
@RestController @RequestMapping("/api/users/me/preferences")public class UserPreferencesController{
 private final UserPreferencesService service;public UserPreferencesController(UserPreferencesService service){this.service=service;}
 @GetMapping public ResponseEntity<ApiResponse<PreferencesResponse>> get(){return ResponseEntity.ok(ApiResponse.success(service.get(CurrentUser.require().id())));}
 @PatchMapping public ResponseEntity<ApiResponse<PreferencesResponse>> patch(@Valid @RequestBody PreferencesRequest request){return ResponseEntity.ok(ApiResponse.success(service.patch(CurrentUser.require().id(),request)));}
}
