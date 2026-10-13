package io.github.hienpham0344.stayfinder.user.service;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.user.dto.UserResponse;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.reward.entity.RewardWallet;
import io.github.hienpham0344.stayfinder.reward.repository.RewardWalletRepository;
import io.github.hienpham0344.stayfinder.reward.service.RewardWalletLocks;
import io.github.hienpham0344.stayfinder.reward.service.RewardPolicy;
import org.springframework.stereotype.Service;
@Service
public class UserProfileProjection {
 private final UserMapper mapper;private final RewardWalletRepository wallets;
 public UserProfileProjection(UserMapper mapper,RewardWalletRepository wallets){this.mapper=mapper;this.wallets=wallets;}
 public UserResponse toResponse(User user){
  var base=mapper.toResponse(user);var wallet=wallets.findById(user.getId()).orElseGet(RewardWallet::new);RewardWalletLocks.validate(wallet);
  String tier=RewardPolicy.tier(wallet.getLifetimeEarnedPoints());
  int tierNumber="VIP".equals(tier)?2:"Gold".equals(tier)?1:0;
  return new UserResponse(base.id(),base.fullName(),base.email(),base.phone(),base.role(),base.avatarUrl(),wallet.getAvailablePoints(),tierNumber);
 }
}
