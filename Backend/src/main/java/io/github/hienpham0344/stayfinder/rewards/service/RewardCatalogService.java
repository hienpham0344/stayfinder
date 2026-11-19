package io.github.hienpham0344.stayfinder.rewards.service;

import io.github.hienpham0344.stayfinder.common.exception.*;
import io.github.hienpham0344.stayfinder.rewards.dto.RewardDtos;
import io.github.hienpham0344.stayfinder.rewards.entity.RewardCatalog;
import io.github.hienpham0344.stayfinder.rewards.repository.RewardCatalogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;
import java.util.UUID;

@Service
@PreAuthorize("hasRole('ADMIN')")
public class RewardCatalogService {
    private final RewardCatalogRepository repository;
    private final Clock clock;
    private final io.github.hienpham0344.stayfinder.audit.service.AuditService audit;
    public RewardCatalogService(RewardCatalogRepository repository, Clock clock,
                                io.github.hienpham0344.stayfinder.audit.service.AuditService audit) {
        this.repository = repository; this.clock = clock; this.audit = audit;
    }
    @Transactional(readOnly = true)
    public Page<RewardDtos.Catalog> list(Pageable page) { return repository.findAll(page).map(RewardDtos.Catalog::from); }
    @Transactional
    public RewardDtos.Catalog create(RewardDtos.CatalogRequest request) {
        RewardCatalog item = new RewardCatalog(); item.setCreatedAt(clock.instant());
        apply(item, request); item = repository.saveAndFlush(item);
        audit.record(io.github.hienpham0344.stayfinder.security.CurrentUser.require().id(), "REWARD_CATALOG_CREATED", "reward_catalog", item.getId(), null);
        return RewardDtos.Catalog.from(item);
    }
    @Transactional
    public RewardDtos.Catalog update(UUID id, RewardDtos.CatalogRequest request) {
        RewardCatalog item = repository.findById(id).orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_ERROR));
        if (item.getVersion() != request.version()) throw new BusinessException(ErrorCode.DUPLICATE_RESOURCE);
        apply(item, request); item = repository.saveAndFlush(item);
        audit.record(io.github.hienpham0344.stayfinder.security.CurrentUser.require().id(), "REWARD_CATALOG_UPDATED", "reward_catalog", item.getId(), null);
        return RewardDtos.Catalog.from(item);
    }
    private void apply(RewardCatalog item, RewardDtos.CatalogRequest request) {
        if (request.discountAmount().compareTo(request.minSpend()) >= 0) throw new BusinessException(ErrorCode.VALIDATION_ERROR);
        item.setName(request.name().trim()); item.setPointsCost(request.pointsCost()); item.setDiscountAmount(request.discountAmount());
        item.setMinSpend(request.minSpend()); item.setValidityDays(request.validityDays()); item.setEnabled(request.enabled());
    }
}
