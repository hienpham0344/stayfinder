package io.github.hienpham0344.stayfinder.user;
import io.github.hienpham0344.stayfinder.user.service.UserProfileProjection;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.mapper.UserMapper;
import io.github.hienpham0344.stayfinder.reward.entity.RewardWallet;
import io.github.hienpham0344.stayfinder.reward.repository.RewardWalletRepository;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class UserProfileRewardsProjectionTest {
 @Test void publicProfileDerivesRewardBalanceAndTierInsteadOfStaleUserCache(){
  var repo=mock(RewardWalletRepository.class);var user=new User();user.setId(UUID.randomUUID());user.setLoyaltyPoints(9999);user.setLoyaltyTier(2);
  var wallet=new RewardWallet();wallet.setUserId(user.getId());wallet.setAvailablePoints(900);wallet.setReservedPoints(1000);wallet.setLifetimeEarnedPoints(12000);
  when(repo.findById(user.getId())).thenReturn(Optional.of(wallet));
  var projection=new UserProfileProjection(Mappers.getMapper(UserMapper.class),repo);
  var response=projection.toResponse(user);assertEquals(900L,response.loyaltyPoints());assertEquals(1,response.loyaltyTier());
  wallet.setAvailablePoints(3_000_000_000L);assertEquals(3_000_000_000L,projection.toResponse(user).loyaltyPoints());
 }
 @Test void absentLedgerWalletDoesNotGrantLegacyOrFixturePoints(){
  var repo=mock(RewardWalletRepository.class);var user=new User();user.setId(UUID.randomUUID());user.setLoyaltyPoints(9999);user.setLoyaltyTier(2);
  when(repo.findById(user.getId())).thenReturn(Optional.empty());
  var response=new UserProfileProjection(Mappers.getMapper(UserMapper.class),repo).toResponse(user);
  assertEquals(0L,response.loyaltyPoints());assertEquals(0,response.loyaltyTier());verify(repo,never()).save(any());
 }
}
