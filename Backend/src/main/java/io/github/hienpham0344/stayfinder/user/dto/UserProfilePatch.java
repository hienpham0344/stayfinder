package io.github.hienpham0344.stayfinder.user.dto;
import com.fasterxml.jackson.annotation.*;
import jakarta.validation.constraints.Size;
public class UserProfilePatch {
    @Size(max=120) private String fullName;
    @Size(max=30) private String phone;
    private boolean fullNameSet,phoneSet;
    public String getFullName(){return fullName;}
    public String getPhone(){return phone;}
    @JsonSetter("fullName") public void setFullName(String value){fullName=value;fullNameSet=true;}
    @JsonSetter("phone") public void setPhone(String value){phone=value;phoneSet=true;}
    @JsonIgnore public boolean isFullNameSet(){return fullNameSet;}
    @JsonIgnore public boolean isPhoneSet(){return phoneSet;}
}
