package io.github.hienpham0344.stayfinder.user.service;
import io.github.hienpham0344.stayfinder.user.repository.*;import io.github.hienpham0344.stayfinder.user.entity.UserPreferences;import io.github.hienpham0344.stayfinder.user.dto.*;import io.github.hienpham0344.stayfinder.common.exception.*;import jakarta.persistence.EntityManager;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import java.util.*;
@Service public class UserPreferencesService{
 private final UserPreferencesRepository rows;private final UserRepository users;private final EntityManager em;
 public UserPreferencesService(UserPreferencesRepository rows,UserRepository users,EntityManager em){this.rows=rows;this.users=users;this.em=em;}
 @Transactional(readOnly=true)public PreferencesResponse get(UUID userId){return rows.findById(userId).map(this::view).orElseGet(()->new PreferencesResponse("en-US",true));}
 @Transactional public PreferencesResponse patch(UUID userId,PreferencesRequest request){
  if(request==null||request.language()==null&&request.bookingNotifications()==null||request.language()!=null&&!Set.of("en-US","vi-VN","fr-FR").contains(request.language()))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
  users.lockById(userId).orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND));var existing=rows.findById(userId);var row=existing.orElseGet(()->{var value=new UserPreferences();value.setUserId(userId);return value;});if(existing.isPresent())em.refresh(row);
  if(request.language()!=null)row.setLanguage(request.language());if(request.bookingNotifications()!=null)row.setBookingNotifications(request.bookingNotifications());return view(rows.save(row));
 }
 private PreferencesResponse view(UserPreferences p){return new PreferencesResponse(p.getLanguage(),p.isBookingNotifications());}
}
