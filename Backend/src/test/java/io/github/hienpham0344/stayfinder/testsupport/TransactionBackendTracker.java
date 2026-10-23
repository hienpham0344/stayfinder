package io.github.hienpham0344.stayfinder.testsupport;
import java.util.concurrent.*;
public final class TransactionBackendTracker {
 private TransactionBackendTracker(){}
 public static final ConcurrentMap<Long,Integer> PIDS=new ConcurrentHashMap<>();
}
