package io.github.hienpham0344.stayfinder.media.controller;
import io.github.hienpham0344.stayfinder.media.service.MediaService;import io.github.hienpham0344.stayfinder.media.dto.MediaUploadResponse;import io.github.hienpham0344.stayfinder.common.response.ApiResponse;import io.github.hienpham0344.stayfinder.security.CurrentUser;
import org.springframework.web.bind.annotation.*;import org.springframework.web.multipart.MultipartFile;import org.springframework.http.*;import java.time.Instant;import java.util.UUID;
@RestController @RequestMapping("/api/media")public class MediaController{
 private final MediaService service;public MediaController(MediaService service){this.service=service;}
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)public ResponseEntity<ApiResponse<MediaUploadResponse>> upload(@RequestPart("image")MultipartFile image){return ResponseEntity.ok(ApiResponse.success(service.upload(CurrentUser.require().id(),image)));}
 @DeleteMapping("/{id}")public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id){service.deleteUnattached(CurrentUser.require().id(),id);return ResponseEntity.ok(ApiResponse.success(null));}
 @GetMapping("/{id}/content")public ResponseEntity<byte[]> content(@PathVariable UUID id,@RequestParam long expires,@RequestParam String signature){var content=service.openSigned(id,Instant.ofEpochSecond(expires),signature);return ResponseEntity.ok().contentType(MediaType.parseMediaType(content.mimeType())).header("X-Content-Type-Options","nosniff").header("Content-Disposition","inline; filename=\"image\"").cacheControl(CacheControl.noStore()).body(content.bytes());}
}
