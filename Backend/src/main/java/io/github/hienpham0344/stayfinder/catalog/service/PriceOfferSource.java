package io.github.hienpham0344.stayfinder.catalog.service;

import io.github.hienpham0344.stayfinder.catalog.dto.RawDemoOffer;
import java.util.List;
import java.util.UUID;

/** A provider adapter returns normalized nightly USD cents; trip totals are calculated centrally. */
public interface PriceOfferSource {
    List<RawDemoOffer> find(UUID accommodationId, UUID roomId);
}
