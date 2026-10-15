package io.github.hienpham0344.stayfinder.media.service;
import io.github.hienpham0344.stayfinder.media.entity.MediaAsset;import io.github.hienpham0344.stayfinder.media.repository.MediaAssetRepository;import io.github.hienpham0344.stayfinder.media.dto.MediaUploadResponse;import io.github.hienpham0344.stayfinder.common.exception.*;
import jakarta.persistence.EntityManager;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.*;import org.springframework.transaction.support.*;import org.springframework.web.multipart.MultipartFile;import org.springframework.data.domain.PageRequest;
import java.time.*;import java.util.*;
@Service public class MediaService{
 private final MediaAssetRepository rows;private final LocalMediaStorage storage;private final MediaUrlSigner signer;private final EntityManager em;private final Clock clock;
 public MediaService(MediaAssetRepository rows,LocalMediaStorage storage,MediaUrlSigner signer,EntityManager em,Clock clock){this.rows=rows;this.storage=storage;this.signer=signer;this.em=em;this.clock=clock;}
 @Transactional public MediaUploadResponse upload(UUID owner,MultipartFile image){
  if(owner==null)throw new BusinessException(ErrorCode.UNAUTHORIZED);UUID id=UUID.randomUUID();var ticket=signer.ticket(id);var file=storage.store(id,image);
  var asset=new MediaAsset();asset.setId(id);asset.setUserId(owner);asset.setMimeType(file.mimeType());asset.setSizeBytes(file.sizeBytes());asset.setCreatedAt(clock.instant());asset.setUnattachedSince(clock.instant());
  try{if(TransactionSynchronizationManager.isSynchronizationActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCompletion(int status){if(status!=STATUS_COMMITTED)removeFile(id);}});rows.saveAndFlush(asset);}
  catch(RuntimeException e){removeFile(id);throw e;}return new MediaUploadResponse(id,ticket.displayUrl(),ticket.expiresAt(),file.mimeType(),file.sizeBytes());
 }
 @Transactional public void deleteUnattached(UUID owner,UUID id){var a=locked(id);if(!Objects.equals(owner,a.getUserId())||a.getReviewId()!=null)throw new BusinessException(ErrorCode.FORBIDDEN);rows.delete(a);afterCommitRemove(id);}
 @Transactional(propagation=Propagation.MANDATORY) public void replaceAttachments(UUID owner,UUID reviewId,List<UUID> desired){
  if(desired==null||desired.size()>5||desired.stream().anyMatch(Objects::isNull)||new HashSet<>(desired).size()!=desired.size())throw new BusinessException(ErrorCode.MEDIA_INVALID);
  var previous=rows.findByReviewId(reviewId);var ids=new TreeSet<UUID>();ids.addAll(desired);previous.forEach(a->ids.add(a.getId()));var locked=new ArrayList<MediaAsset>();
  for(var id:ids){var a=locked(id);if(!Objects.equals(owner,a.getUserId())||a.getReviewId()!=null&&!reviewId.equals(a.getReviewId()))throw new BusinessException(ErrorCode.FORBIDDEN);locked.add(a);}
  for(var a:locked){boolean attached=desired.contains(a.getId());a.setReviewId(attached?reviewId:null);a.setUnattachedSince(attached?null:clock.instant());}
 }
 @Transactional(readOnly=true) public List<String> reviewUrls(UUID reviewId){return rows.findByReviewId(reviewId).stream().sorted(Comparator.comparing(MediaAsset::getCreatedAt).thenComparing(MediaAsset::getId)).map(a->signer.ticket(a.getId()).displayUrl()).toList();}
 public record Content(byte[] bytes,String mimeType){}
 @Transactional(readOnly=true)public Content openSigned(UUID id,Instant expires,String signature){signer.verify(id,expires,signature);var a=rows.findById(id).orElseThrow(()->new BusinessException(ErrorCode.MEDIA_INVALID));if(!Set.of("image/jpeg","image/png","image/webp").contains(a.getMimeType()))throw new BusinessException(ErrorCode.MEDIA_INVALID);var bytes=storage.read(id);if(bytes.length!=a.getSizeBytes())throw new BusinessException(ErrorCode.MEDIA_INVALID);return new Content(bytes,a.getMimeType());}
 @Transactional public void cleanup(){Instant cutoff=clock.instant().minusSeconds(86400);for(var candidate:rows.findByReviewIdIsNullAndUnattachedSinceBeforeOrderByUnattachedSinceAsc(cutoff,PageRequest.of(0,100))){var a=locked(candidate.getId());if(a.getReviewId()==null&&a.getUnattachedSince()!=null&&a.getUnattachedSince().isBefore(cutoff)){rows.delete(a);afterCommitRemove(a.getId());}}}
 public void cleanupOrphanFiles(){storage.removeUnpersistedOlderThan(clock.instant().minusSeconds(86400),rows::existsById,100);}
 private MediaAsset locked(UUID id){var a=rows.lockById(id).orElseThrow(()->new BusinessException(ErrorCode.MEDIA_INVALID));em.refresh(a);return a;}
 private void afterCommitRemove(UUID id){if(TransactionSynchronizationManager.isSynchronizationActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){removeFile(id);}});else removeFile(id);}
 private void removeFile(UUID id){try{storage.delete(id);}catch(RuntimeException ignored){org.slf4j.LoggerFactory.getLogger(MediaService.class).warn("Media cleanup requires retry");}}
}
