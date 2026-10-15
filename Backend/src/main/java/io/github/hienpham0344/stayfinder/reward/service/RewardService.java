package io.github.hienpham0344.stayfinder.reward.service;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.reward.dto.*;
import org.springframework.data.domain.Pageable;
import java.util.*;
public interface RewardService {
 RewardWalletResponse wallet(UUID userId);
 List<RewardOfferResponse> catalog(UUID userId);
 PageResponse<RewardHistoryResponse> history(UUID userId,Pageable pageable);
 PageResponse<RewardClaimResponse> claims(UUID userId,Pageable pageable);
 RewardClaimResponse claim(UUID userId,UUID offerId,String key);
}
