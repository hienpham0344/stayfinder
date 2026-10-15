package io.github.hienpham0344.stayfinder.security;
import io.github.hienpham0344.stayfinder.auth.controller.AuthController;
import io.github.hienpham0344.stayfinder.auth.dto.LoginRequest;
import io.github.hienpham0344.stayfinder.auth.service.AuthService;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.junit.jupiter.api.Test;import org.springframework.mock.web.*;
import java.time.*;import java.util.*;import java.util.concurrent.*;import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;import static org.mockito.Mockito.*;
class AuthControllerConcurrencyTest{
 @Test void concurrentNormalizedEmailAdmissionsAreBounded()throws Exception{burst(8,5,true);}
 @Test void concurrentIpAdmissionsAreBounded()throws Exception{burst(24,20,false);}
 void burst(int attempts,int limit,boolean sameEmail)throws Exception{
  var limiter=new AuthAttemptLimiter(Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC));var auth=mock(AuthService.class);
  var controller=new AuthController(auth,new AuthTransport("",false),limiter);var start=new CountDownLatch(1);var reached=new CountDownLatch(attempts);var release=new CountDownLatch(1);var entered=new AtomicInteger();
  when(auth.login(any())).thenAnswer(i->{entered.incrementAndGet();reached.countDown();assertTrue(release.await(10,TimeUnit.SECONDS));throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);});
  var executor=Executors.newFixedThreadPool(attempts);var tasks=new ArrayList<Future<Boolean>>();
  try{
   for(int index=0;index<attempts;index++){final int n=index;tasks.add(executor.submit(()->{start.await();var request=new MockHttpServletRequest();request.addHeader("X-Client-Platform","native");request.setRemoteAddr(sameEmail?"ip-"+n:"one-ip");try{controller.login(new LoginRequest(sameEmail?(n%2==0?" NAME@Example.test ":"name@example.test"):"user"+n+"@example.test","Synthetic only password"),request,new MockHttpServletResponse());throw new AssertionError("Must fail");}catch(BusinessException e){if(e.getErrorCode()==ErrorCode.RATE_LIMITED){reached.countDown();return false;}assertEquals(ErrorCode.INVALID_CREDENTIALS,e.getErrorCode());return true;}}));}
   start.countDown();assertTrue(reached.await(10,TimeUnit.SECONDS),"All requests must either enter auth or be denied, without global serialization");assertEquals(limit,entered.get(),"In-flight password checks must reserve email/IP capacity");release.countDown();int admitted=0;for(var task:tasks)if(task.get(10,TimeUnit.SECONDS))admitted++;assertEquals(limit,admitted);
  }finally{release.countDown();executor.shutdownNow();assertTrue(executor.awaitTermination(10,TimeUnit.SECONDS));}
 }
 @Test void successfulOrNonCredentialFailureReleasesAdmission(){
  var limiter=new AuthAttemptLimiter(Clock.systemUTC());var auth=mock(AuthService.class);var controller=new AuthController(auth,new AuthTransport("",false),limiter);
  var request=new MockHttpServletRequest();request.addHeader("X-Client-Platform","native");request.setRemoteAddr("ip");var login=new LoginRequest("name@example.test","Synthetic only password");
  for(int n=0;n<8;n++)assertDoesNotThrow(()->controller.login(login,request,new MockHttpServletResponse()));
  when(auth.login(any())).thenThrow(new IllegalStateException("Synthetic dependency unavailable"));for(int n=0;n<8;n++)assertThrows(IllegalStateException.class,()->controller.login(login,request,new MockHttpServletResponse()));
  verify(auth,times(16)).login(login);
 }
}
