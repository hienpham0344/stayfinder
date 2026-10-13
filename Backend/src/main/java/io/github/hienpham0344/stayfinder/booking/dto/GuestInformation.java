package io.github.hienpham0344.stayfinder.booking.dto;
import jakarta.validation.constraints.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import java.util.Locale;
public record GuestInformation(@NotBlank @Size(max=100) String fullName,@NotBlank @Email @Size(max=254) String email,
 @NotBlank @Pattern(regexp="\\+?[0-9]{9,15}") String phone,@Size(max=2000) String specialRequest) {
 public GuestInformation {
  fullName=fullName==null?null:fullName.trim();email=email==null?null:email.trim().toLowerCase(Locale.ROOT);
  phone=phone==null?null:phone.trim();specialRequest=specialRequest==null?null:specialRequest.trim();
  if(specialRequest!=null&&specialRequest.isEmpty())specialRequest=null;
 }
 public void validate(){
  if(fullName==null||fullName.isBlank()||fullName.length()>100||email==null||email.length()>254
   ||!email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+")||phone==null||!phone.matches("\\+?[0-9]{9,15}")
   ||(specialRequest!=null&&specialRequest.length()>2000))throw new BusinessException(ErrorCode.VALIDATION_ERROR);
 }
}
