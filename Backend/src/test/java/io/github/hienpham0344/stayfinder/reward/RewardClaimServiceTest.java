package io.github.hienpham0344.stayfinder.reward;
import io.github.hienpham0344.stayfinder.reward.entity.*;
import io.github.hienpham0344.stayfinder.reward.repository.*;
import io.github.hienpham0344.stayfinder.reward.service.*;
import io.github.hienpham0344.stayfinder.common.audit.*;
import io.github.hienpham0344.stayfinder.common.idempotency.*;
import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.user.entity.User;
import io.github.hienpham0344.stayfinder.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import tools.jackson.databind.json.JsonMapper;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
class RewardClaimServiceTest {
 private final UserRepository users=mock(UserRepository.class);
 private final RewardWalletRepository wallets=mock(RewardWalletRepository.class);
 private final RewardOfferRepository offers=mock(RewardOfferRepository.class);
 private final RewardClaimRepository claims=mock(RewardClaimRepository.class);
 private final RewardLedgerEntryRepository ledger=mock(RewardLedgerEntryRepository.class);
 private final IdempotencyRepository keys=mock(IdempotencyRepository.class);
 private final AuditRepository audit=mock(AuditRepository.class);
 private final UUID owner=UUID.randomUUID(),offerId=UUID.randomUUID();
 private final Instant now=Instant.parse("2026-10-13T00:00:00Z");
 private final Clock clock=Clock.fixed(now,ZoneOffset.UTC);
 private final RewardWallet wallet=new RewardWallet();
 private final Map<String,IdempotencyRecord> savedKeys=new HashMap<>();
 private final List<RewardClaim> savedClaims=new ArrayList<>();private final List<RewardLedgerEntry> savedLedger=new ArrayList<>();
 private RewardServiceImpl service;
 @BeforeEach void setup(){
  User user=new User();user.setId(owner);user.setCredentialState("active");
  when(users.lockById(owner)).thenReturn(Optional.of(user));when(users.findById(owner)).thenReturn(Optional.of(user));
  wallet.setUserId(owner);wallet.setAvailablePoints(1000);wallet.setReservedPoints(0);wallet.setLifetimeEarnedPoints(10000);
  when(wallets.lockById(owner)).thenReturn(Optional.of(wallet));when(wallets.findById(owner)).thenReturn(Optional.of(wallet));
  RewardOffer offer=new RewardOffer();offer.setId(offerId);offer.setCode("DEMO_VOUCHER");offer.setTitle("Demo 5% voucher");offer.setKind("discount_voucher");
  offer.setActive(true);offer.setPointsCost(1000);offer.setValidityDays(30);offer.setDiscountPercent(5);offer.setDiscountCapCents(2500L);offer.setMinimumRoomSubtotalCents(10000L);offer.setFulfilmentDescription("Demo entitlement only.");
  when(offers.lockById(offerId)).thenReturn(Optional.of(offer));when(offers.findByActiveTrueOrderByPointsCostAscIdAsc()).thenReturn(List.of(offer));
  when(claims.save(any())).thenAnswer(i->{RewardClaim c=i.getArgument(0);savedClaims.add(c);return c;});
  when(ledger.save(any())).thenAnswer(i->{RewardLedgerEntry e=i.getArgument(0);savedLedger.add(e);return e;});
  when(keys.findByUserIdAndOperationAndRequestKey(any(),any(),any())).thenAnswer(i->Optional.ofNullable(savedKeys.get(i.getArgument(2))));
  when(keys.save(any())).thenAnswer(i->{IdempotencyRecord k=i.getArgument(0);savedKeys.put(k.getRequestKey(),k);return k;});
  var idempotency=new IdempotencyService(keys,users,mock(IdempotencyLockRepository.class),JsonMapper.builder().findAndAddModules().build(),clock);
  service=new RewardServiceImpl(new RewardWalletLocks(users,wallets),wallets,offers,claims,ledger,idempotency,new AuditService(audit,clock),clock);
 }
 @Test void claimDebitsOncePersistsOwnedTermsAndExpiresInThirtyDays(){
  var first=service.claim(owner,offerId,"claim-1");var retry=service.claim(owner,offerId,"claim-1");
  assertEquals(first,retry);assertEquals(1,savedClaims.size());assertEquals(1,savedLedger.size());assertEquals(0,wallet.getAvailablePoints());
  assertEquals(owner,savedClaims.getFirst().getUserId());assertEquals(now.plus(Duration.ofDays(30)),first.expiresAt());
  assertEquals(5,first.offer().terms().discountPercent());assertEquals(-1000,savedLedger.getFirst().getDeltaPoints());
  verify(audit,times(1)).save(any());
 }
 @Test void reservedPointsCannotBeSpentByAClaimAndFailedClaimDoesNotCreateEntitlement(){
  wallet.setAvailablePoints(900);wallet.setReservedPoints(1000);
  var ex=assertThrows(BusinessException.class,()->service.claim(owner,offerId,"claim-1"));
  assertEquals(ErrorCode.INSUFFICIENT_POINTS,ex.getErrorCode());assertTrue(savedClaims.isEmpty());assertTrue(savedLedger.isEmpty());
  assertEquals(900,wallet.getAvailablePoints());assertEquals(1000,wallet.getReservedPoints());
 }
 @Test void expiredOfferAndUnknownOwnerFailBeforeRewardMutation(){
  offers.lockById(offerId).orElseThrow().setValidUntil(now);
  assertThrows(BusinessException.class,()->service.claim(owner,offerId,"claim-1"));assertTrue(savedClaims.isEmpty());
  when(users.lockById(owner)).thenReturn(Optional.empty());
  assertThrows(BusinessException.class,()->service.claim(owner,offerId,"claim-2"));assertTrue(savedClaims.isEmpty());
 }
 @Test void walletAndCatalogExposeAvailableBalanceAndLifetimeTier(){
  wallet.setAvailablePoints(900);wallet.setReservedPoints(1000);
  assertEquals("Gold",service.wallet(owner).tier());assertEquals(900,service.wallet(owner).availablePoints());
  assertFalse(service.catalog(owner).getFirst().eligible());
 }
}
