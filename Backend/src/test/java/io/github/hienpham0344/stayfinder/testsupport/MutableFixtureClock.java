package io.github.hienpham0344.stayfinder.testsupport;
import java.time.*;
public final class MutableFixtureClock extends Clock {
 public static final Instant INITIAL=Instant.parse("2026-10-13T12:00:00Z");
 private volatile Instant now=INITIAL;
 public void set(Instant value){now=value;}public void reset(){now=INITIAL;}
 @Override public ZoneId getZone(){return ZoneOffset.UTC;}@Override public Clock withZone(ZoneId zone){return Clock.fixed(now,zone);}
 @Override public Instant instant(){return now;}
}
