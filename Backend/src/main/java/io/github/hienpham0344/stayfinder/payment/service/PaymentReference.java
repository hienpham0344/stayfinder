package io.github.hienpham0344.stayfinder.payment.service;
import java.math.BigInteger;
import java.util.*;
import java.util.regex.Pattern;
public final class PaymentReference {
 private PaymentReference(){}
 private static final BigInteger SPACE=BigInteger.valueOf(36).pow(10);
 private static final Pattern TOKEN=Pattern.compile("(?<![\\p{L}\\p{N}])SF[A-Z0-9]{10}(?![\\p{L}\\p{N}])");
 public static String create(UUID paymentId){
  Objects.requireNonNull(paymentId);
  String suffix=new BigInteger(paymentId.toString().replace("-",""),16).mod(SPACE).toString(36).toUpperCase(Locale.ROOT);
  return "SF"+"0".repeat(10-suffix.length())+suffix;
 }
 public static String resolve(String parsedCode,String content){
  if(content==null)return null;
  var matcher=TOKEN.matcher(content.toUpperCase(Locale.ROOT));
  if(!matcher.find())return null;String found=matcher.group();
  if(matcher.find())return null;
  if(parsedCode!=null&&!parsedCode.isBlank()&&!found.equals(parsedCode.trim().toUpperCase(Locale.ROOT)))return null;
  return found;
 }
}
