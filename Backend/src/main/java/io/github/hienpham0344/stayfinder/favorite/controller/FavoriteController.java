package io.github.hienpham0344.stayfinder.favorite.controller;
import io.github.hienpham0344.stayfinder.common.response.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.favorite.dto.*;
import io.github.hienpham0344.stayfinder.favorite.service.FavoriteService;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;
@RestController @RequestMapping("/api/favorites")
public class FavoriteController {
    private final FavoriteService service;
    public FavoriteController(FavoriteService service){this.service=service;}
    @GetMapping public ResponseEntity<ApiResponse<PageResponse<FavoriteCardResponse>>> list(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){
        if(page<0||size<1||size>100)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        return ResponseEntity.ok(ApiResponse.success(service.list(PageRequest.of(page,size))));
    }
    @PutMapping("/{accommodationId}") public ResponseEntity<ApiResponse<FavoriteResponse>> add(@PathVariable UUID accommodationId){
        return ResponseEntity.ok(ApiResponse.success(service.add(accommodationId)));
    }
    @DeleteMapping("/{accommodationId}") public ResponseEntity<ApiResponse<Void>> remove(@PathVariable UUID accommodationId){
        service.remove(accommodationId);return ResponseEntity.ok(ApiResponse.success(null));
    }
}
