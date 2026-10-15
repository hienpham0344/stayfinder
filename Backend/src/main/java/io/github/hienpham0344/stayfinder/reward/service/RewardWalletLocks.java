package io.github.hienpham0344.stayfinder.reward.service;
import io.github.hienpham0344.stayfinder.reward.entity.RewardWallet;
import io.github.hienpham0344.stayfinder.reward.repository.RewardWalletRepository;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.util.UUID;
@Service
public class RewardWalletLocks {
 private final UserRepository users;private final RewardWalletRepository wallets;
 public RewardWalletLocks(UserRepository users,RewardWalletRepository wallets){this.users=users;this.wallets=wallets;}
 @Transactional(propagation=Propagation.MANDATORY)
 public RewardWallet lock(UUID userId){
  // User row serializes a wallet's first insert. Every financial path acquires
  // this initialization mutex and wallet before room/booking/payment/claim rows.
  var user=users.lockById(userId).orElseThrow(()->new BusinessException(ErrorCode.USER_NOT_FOUND));
  // Authentication is enforced at API/idempotency boundaries. Bookkeeping
  // must still release/refund an existing reservation if credentials are unenrolled.
  var wallet=wallets.lockById(userId).orElseGet(()->{
   var created=new RewardWallet();created.setUserId(userId);return wallets.save(created);
  });
  validate(wallet);return wallet;
 }
 public static void validate(RewardWallet wallet){
  if(wallet.getAvailablePoints()<0||wallet.getReservedPoints()<0||wallet.getLifetimeEarnedPoints()<0||
     wallet.getAvailablePoints()>RewardPolicy.MAX_POINTS||wallet.getReservedPoints()>RewardPolicy.MAX_POINTS||
     wallet.getLifetimeEarnedPoints()>RewardPolicy.MAX_POINTS)throw new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);
 }
}
