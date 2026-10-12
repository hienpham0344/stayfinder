package io.github.hienpham0344.stayfinder.common;

import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.lang.reflect.InvocationTargetException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class ApiDtoContractTest {
    private final JsonMapper mapper = JsonMapper.builder().findAndAddModules().build();

    private Object money(long cents, String currency) throws Throwable {
        try {
            return Class.forName("io.github.hienpham0344.stayfinder.common.dto.MoneyUsd")
                    .getConstructor(long.class, String.class).newInstance(cents, currency);
        } catch (ClassNotFoundException exception) {
            return fail("The public USD-cent money contract is not implemented");
        } catch (InvocationTargetException exception) {
            throw exception.getCause();
        }
    }

    @Test void serializesExactIntegerUsdCentsInsideExistingSuccessEnvelope() throws Throwable {
        JsonNode json = mapper.readTree(mapper.writeValueAsString(ApiResponse.success(money(29900, "USD"))));
        assertEquals("SUCCESS", json.get("code").asString());
        assertEquals(29900L, json.get("result").get("amountCents").asLong());
        assertTrue(json.get("result").get("amountCents").isIntegralNumber());
        assertEquals("USD", json.get("result").get("currency").asString());
        assertEquals(2, json.get("result").size());
    }
    @Test void permitsZeroFeesWithoutInventingNegativeMoney() throws Throwable {
        assertNotNull(money(0, "USD"));
        assertThrows(IllegalArgumentException.class, () -> money(-1, "USD"));
    }
    @Test void rejectsSettlementCurrencyInProductMoney() {
        assertThrows(IllegalArgumentException.class, () -> money(100, "VND"));
    }
    @Test void rejectsAmountsNotExactlyRepresentableByJavascript() {
        assertThrows(IllegalArgumentException.class, () -> money(9007199254740992L, "USD"));
    }
    @Test void favoriteCardUsesTheApprovedAccommodationKey() {
        var stay=new io.github.hienpham0344.stayfinder.accommodation.dto.StayCardResponse(
            java.util.UUID.randomUUID(),"Stay",null,null,null,null,null,null,
            io.github.hienpham0344.stayfinder.common.dto.MoneyUsd.cents(29900),null,null,0,true);
        var dto=new io.github.hienpham0344.stayfinder.favorite.dto.FavoriteCardResponse(java.util.UUID.randomUUID(),stay);
        var json=mapper.readTree(mapper.writeValueAsString(dto));
        assertEquals(stay.id().toString(),json.get("accommodation").get("id").asString());
        assertNull(json.get("stay"));
    }
    @Test void exposesStableItemsPaginationInsteadOfFrameworkEntityPage() {
        Object page = assertDoesNotThrow(() -> Class.forName(
                "io.github.hienpham0344.stayfinder.common.response.PageResponse")
                .getConstructor(List.class, int.class, int.class, long.class, int.class)
                .newInstance(List.of("a","b"), 0, 20, 2L, 1),
                "The items-based public pagination contract is not implemented");
        JsonNode json = mapper.readTree(mapper.writeValueAsString(page));
        assertEquals(2, json.get("items").size());
        assertEquals(20, json.get("size").asInt());
        assertEquals(2L, json.get("totalElements").asLong());
        assertNull(json.get("content"));
    }
}
