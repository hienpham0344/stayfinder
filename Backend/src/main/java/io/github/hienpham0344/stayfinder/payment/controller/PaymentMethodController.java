package io.github.hienpham0344.stayfinder.payment.controller;
import io.github.hienpham0344.stayfinder.payment.dto.PaymentMethodOption;
import io.github.hienpham0344.stayfinder.payment.service.PaymentProvider;
import io.github.hienpham0344.stayfinder.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;import java.util.List;
@RestController @RequestMapping("/api/payment-methods")
public class PaymentMethodController {
 private final PaymentProvider provider;
 public PaymentMethodController(PaymentProvider provider){this.provider=provider;}
 @GetMapping public ApiResponse<List<PaymentMethodOption>> list(){
  boolean enabled=provider.enabled();
  return ApiResponse.success(List.of(new PaymentMethodOption("bank_transfer",enabled,"sepay","test","USD","VND",enabled?null:"provider_unavailable"),
   new PaymentMethodOption("pay_at_property",true,"property",null,"USD",null,null)));
 }
}
