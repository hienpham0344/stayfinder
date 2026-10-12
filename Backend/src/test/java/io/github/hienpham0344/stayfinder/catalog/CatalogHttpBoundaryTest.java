package io.github.hienpham0344.stayfinder.catalog;

import io.github.hienpham0344.stayfinder.accommodation.controller.AccommodationController;
import io.github.hienpham0344.stayfinder.accommodation.dto.*;
import io.github.hienpham0344.stayfinder.accommodation.service.AccommodationService;
import io.github.hienpham0344.stayfinder.common.response.PageResponse;
import io.github.hienpham0344.stayfinder.room.service.RoomService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers={AccommodationController.class,io.github.hienpham0344.stayfinder.catalog.controller.CatalogMetadataController.class})
@AutoConfigureMockMvc(addFilters=false)
@org.springframework.context.annotation.Import(io.github.hienpham0344.stayfinder.config.ClockConfig.class)
class CatalogHttpBoundaryTest {
    @Autowired MockMvc mvc;
    @MockitoBean AccommodationService accommodations;
    @MockitoBean RoomService rooms;
    @MockitoBean io.github.hienpham0344.stayfinder.catalog.service.PriceComparisonService comparisons;
    @MockitoBean io.github.hienpham0344.stayfinder.catalog.service.CatalogMetadataService metadata;
    @MockitoBean io.github.hienpham0344.stayfinder.user.repository.UserRepository users;
    @MockitoBean io.github.hienpham0344.stayfinder.auth.repository.RefreshSessionRepository sessions;
    private final UUID id=UUID.randomUUID();

    @BeforeEach void setup() {
        when(accommodations.search(any(),any())).thenReturn(new PageResponse<>(List.of(),0,20,0,0));
        when(rooms.available(any(),any(),any(),anyInt(),anyInt(),anyInt())).thenReturn(List.of());
        when(rooms.listAvailable(any(),any(),any(),anyInt())).thenReturn(List.of());
    }
    @Test void filterAndSuggestionRoutesUseApplicationEnvelopes() throws Exception {
        when(metadata.filters()).thenReturn(new io.github.hienpham0344.stayfinder.catalog.dto.CatalogFiltersResponse(List.of(),List.of(),List.of(),List.of("price"),90,20,20,10));
        when(metadata.suggestions("Da")).thenReturn(List.of(new io.github.hienpham0344.stayfinder.catalog.dto.LocationDto(id,"Da Nang","Da Nang",null)));
        mvc.perform(get("/api/catalog/filters")).andExpect(status().isOk()).andExpect(jsonPath("$.code").value("SUCCESS"))
            .andExpect(jsonPath("$.result.sorts[0]").value("price"));
        mvc.perform(get("/api/locations/suggestions").param("q","Da")).andExpect(status().isOk()).andExpect(jsonPath("$.result[0].id").value(id.toString()));
    }
    @Test void comparisonRouteReturnsSameSelectionBasisAndExplicitDemoUsd() throws Exception {
        UUID tier=UUID.randomUUID();
        var offer=new io.github.hienpham0344.stayfinder.catalog.dto.PriceComparisonOffer("StayFinder",
            io.github.hienpham0344.stayfinder.common.dto.MoneyUsd.cents(123100),io.github.hienpham0344.stayfinder.common.dto.MoneyUsd.cents(29900),
            true,"Free cancellation before check-in",java.time.Instant.parse("2026-10-13T00:00:00Z"),true,true);
        when(comparisons.compare(eq(id),any())).thenAnswer(i->{
            io.github.hienpham0344.stayfinder.common.dto.QuoteSelection s=i.getArgument(1);
            return new io.github.hienpham0344.stayfinder.catalog.dto.ComparisonResult(id,s.roomId(),s.checkIn(),s.checkOut(),s.quantity(),s.adults(),s.children(),List.of(offer));
        });
        mvc.perform(get("/api/accommodations/"+id+"/price-comparisons").param("roomId",tier.toString())
            .param("checkIn","2026-11-01").param("checkOut","2026-11-03").param("quantity","2").param("adults","3").param("children","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.result.quantity").value(2)).andExpect(jsonPath("$.result.children").value(1))
            .andExpect(jsonPath("$.result.offers[0].isDemo").value(true)).andExpect(jsonPath("$.result.offers[0].total.amountCents").value(123100));
    }
    @Test void rejectsOutOfRangePaginationInsteadOfSilentlyClamping() throws Exception {
        mvc.perform(get("/api/accommodations").param("page","-1")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/accommodations").param("size","101")).andExpect(status().isBadRequest());
        verify(accommodations,never()).search(any(),any());
    }
    @Test void rejectsUnknownSearchParametersRatherThanIgnoringAFilter() throws Exception {
        mvc.perform(get("/api/accommodations").param("destinationId",UUID.randomUUID().toString())).andExpect(status().isBadRequest());
    }
    @Test void malformedDestinationAndMissingRoomDatesReturnValidation400() throws Exception {
        mvc.perform(get("/api/accommodations").param("locationId","not-a-uuid")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/accommodations/"+id+"/rooms")).andExpect(status().isBadRequest());
    }
    @Test void canonicalRoomParametersIncludeChildrenAndQuantity() throws Exception {
        mvc.perform(get("/api/accommodations/"+id+"/rooms").param("checkIn","2026-11-01").param("checkOut","2026-11-03")
            .param("adults","3").param("children","1").param("rooms","2")).andExpect(status().isOk());
        verify(rooms).available(eq(id),any(),any(),eq(3),eq(1),eq(2));
    }
    @Test void legacyGuestsAliasIsAcceptedAloneAndRejectedWhenAmbiguous() throws Exception {
        mvc.perform(get("/api/accommodations/"+id+"/rooms").param("checkIn","2026-11-01").param("checkOut","2026-11-03")
            .param("guests","2")).andExpect(status().isOk());
        verify(rooms).available(eq(id),any(),any(),eq(2),eq(0),eq(1));
        mvc.perform(get("/api/accommodations/"+id+"/rooms").param("checkIn","2026-11-01").param("checkOut","2026-11-03")
            .param("guests","2").param("adults","2")).andExpect(status().isBadRequest());
    }
}
