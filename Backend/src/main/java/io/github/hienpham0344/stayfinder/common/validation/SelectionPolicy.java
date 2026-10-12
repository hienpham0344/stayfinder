package io.github.hienpham0344.stayfinder.common.validation;
import io.github.hienpham0344.stayfinder.common.dto.QuoteSelection;
import io.github.hienpham0344.stayfinder.common.exception.*;
import java.time.*;
import java.time.temporal.ChronoUnit;
public final class SelectionPolicy {
    private SelectionPolicy(){}
    public static void validate(QuoteSelection s,ZoneId timezone,Clock clock) {
        if(s==null||s.accommodationId()==null||s.roomId()==null)invalid();
        validateDatesAndGuests(s.checkIn(),s.checkOut(),s.quantity(),s.adults(),s.children(),timezone,clock);
    }
    public static void validateDatesAndGuests(LocalDate in,LocalDate out,int quantity,int adults,int children,ZoneId timezone,Clock clock) {
        if(in==null||out==null||timezone==null||clock==null||!in.isBefore(out)
                ||in.isBefore(LocalDate.now(clock.withZone(timezone)))||ChronoUnit.DAYS.between(in,out)>90
                ||quantity<1||quantity>10||adults<1||adults>20||children<0||children>20)invalid();
    }
    private static void invalid(){throw new BusinessException(ErrorCode.VALIDATION_ERROR);}
}
