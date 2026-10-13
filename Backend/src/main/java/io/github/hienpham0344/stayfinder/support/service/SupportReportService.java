package io.github.hienpham0344.stayfinder.support.service;
import io.github.hienpham0344.stayfinder.support.dto.*;import io.github.hienpham0344.stayfinder.support.entity.SupportReport;import io.github.hienpham0344.stayfinder.support.repository.SupportReportRepository;import io.github.hienpham0344.stayfinder.booking.repository.BookingRepository;import io.github.hienpham0344.stayfinder.common.idempotency.IdempotencyService;import io.github.hienpham0344.stayfinder.common.exception.*;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.time.Clock;import java.util.*;
@Service public class SupportReportService{
 private final SupportReportRepository rows;private final BookingRepository bookings;private final IdempotencyService idem;private final Clock clock;
 public SupportReportService(SupportReportRepository rows,BookingRepository bookings,IdempotencyService idem,Clock clock){this.rows=rows;this.bookings=bookings;this.idem=idem;this.clock=clock;}
 @Transactional public SupportReportResponse submit(UUID userId,SupportReportRequest request,String key){
  if(request==null||request.category()==null||!Set.of("Booking","Payment","Account","Rewards","Other").contains(request.category())||request.description()==null||request.description().isBlank()||request.description().length()>5000)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  if(request.bookingId()!=null&&bookings.findByIdAndUserId(request.bookingId(),userId).isEmpty())throw new BusinessException(ErrorCode.BOOKING_NOT_FOUND);
  String requestKey=key==null?"report."+UUID.randomUUID():key;
  return idem.execute(userId,"support:create",requestKey,idem.fingerprint(request),SupportReportResponse.class,()->{
   var row=new SupportReport();row.setId(UUID.randomUUID());row.setUserId(userId);row.setBookingId(request.bookingId());row.setCategory(request.category());row.setDescription(request.description().trim());row.setStatus("submitted");row.setCreatedAt(clock.instant());rows.save(row);return new SupportReportResponse(row.getId(),row.getStatus(),row.getCreatedAt());
  });
 }
}
