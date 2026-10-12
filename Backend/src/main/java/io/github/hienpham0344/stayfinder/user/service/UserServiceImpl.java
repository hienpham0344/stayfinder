package io.github.hienpham0344.stayfinder.user.service;

import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import io.github.hienpham0344.stayfinder.common.exception.ErrorCode;
import io.github.hienpham0344.stayfinder.security.CurrentUser;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public UserResponse updateProfile(io.github.hienpham0344.stayfinder.user.dto.UserProfilePatch request) {
        if(request==null||!request.isFullNameSet()&&!request.isPhoneSet())throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        String name=request.getFullName();
        if(request.isFullNameSet()) {
            if(name==null||name.trim().isEmpty()||name.trim().length()>120)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            name=name.trim();
        }
        String phone=request.getPhone();
        if(request.isPhoneSet()&&phone!=null) {
            phone=phone.trim();
            if(phone.isEmpty())phone=null;
            else {
                int digits=phone.replaceAll("\\D","").length();
                if(phone.length()>30||!phone.matches("\\+?[0-9 ()-]+")||digits<7||digits>20)throw new BusinessException(ErrorCode.VALIDATION_ERROR);
            }
        }
        User user=userRepository.lockById(CurrentUser.require().id())
            .filter(io.github.hienpham0344.stayfinder.auth.service.AuthServiceImpl::active)
            .orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND));
        if(request.isFullNameSet())user.setFullName(name);
        if(request.isPhoneSet())user.setPhone(phone);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser() {
        User user = userRepository.findById(CurrentUser.require().id())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toResponse(user);
    }
}
