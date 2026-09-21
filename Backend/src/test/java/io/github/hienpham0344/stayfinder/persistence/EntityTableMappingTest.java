package io.github.hienpham0344.stayfinder.persistence;

import io.github.hienpham0344.stayfinder.accommodation.entity.Accommodation;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationType;
import io.github.hienpham0344.stayfinder.accommodation.entity.Image;
import io.github.hienpham0344.stayfinder.accommodation.entity.Feature;
import io.github.hienpham0344.stayfinder.accommodation.entity.AccommodationFeature;
import io.github.hienpham0344.stayfinder.booking.entity.Booking;
import io.github.hienpham0344.stayfinder.booking.entity.BookingDetail;
import io.github.hienpham0344.stayfinder.favorite.entity.Favorite;
import io.github.hienpham0344.stayfinder.payment.entity.Payment;
import io.github.hienpham0344.stayfinder.payment.entity.PaymentMethod;
import io.github.hienpham0344.stayfinder.review.entity.Review;
import io.github.hienpham0344.stayfinder.room.entity.Room;
import io.github.hienpham0344.stayfinder.room.entity.RoomType;
import io.github.hienpham0344.stayfinder.user.entity.User;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EntityTableMappingTest {
    @Test
    void mapsCoreEntitiesToTheLiveTableNames() {
        Map<Class<?>, String> expected = Map.ofEntries(
                Map.entry(User.class, "users"),
                Map.entry(Accommodation.class, "accommodations"),
                Map.entry(AccommodationType.class, "accommodation_type"),
                Map.entry(Image.class, "images"),
                Map.entry(Feature.class, "features"),
                Map.entry(AccommodationFeature.class, "accommodation_features"),
                Map.entry(RoomType.class, "room_type"),
                Map.entry(Room.class, "room"),
                Map.entry(Booking.class, "bookings"),
                Map.entry(BookingDetail.class, "booking_details"),
                Map.entry(Payment.class, "payments"),
                Map.entry(PaymentMethod.class, "payments_method"),
                Map.entry(Favorite.class, "favorites"),
                Map.entry(Review.class, "reviews"));

        expected.forEach((entity, tableName) -> {
            assertTrue(entity.isAnnotationPresent(Entity.class));
            assertEquals(tableName, entity.getAnnotation(Table.class).name());
        });
    }
}
