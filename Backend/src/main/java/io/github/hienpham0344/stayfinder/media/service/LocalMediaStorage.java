package io.github.hienpham0344.stayfinder.media.service;
import io.github.hienpham0344.stayfinder.common.exception.*;
import org.springframework.beans.factory.annotation.*;import org.springframework.stereotype.Component;import org.springframework.web.multipart.MultipartFile;
import java.io.*;import java.nio.file.*;import java.util.*;
@Component
public class LocalMediaStorage{
 public static final int MAX_BYTES=5*1024*1024;private final Path configuredRoot;
 @Autowired public LocalMediaStorage(@Value("${stayfinder.media.storage-root:storage/reviews}") String root){this(Path.of(root));}
 public LocalMediaStorage(Path root){configuredRoot=root.toAbsolutePath().normalize();}
 public record Stored(String mimeType,long sizeBytes){}
 public Stored store(UUID id,MultipartFile image){
  if(image==null||image.isEmpty())throw invalid();if(image.getSize()>MAX_BYTES)throw new BusinessException(ErrorCode.MEDIA_TOO_LARGE);
  String name=image.getOriginalFilename();if(name==null||name.contains("/")||name.contains("\\")||name.contains("..")||name.chars().anyMatch(c->c<32))throw invalid();
  byte[] bytes;try(var in=image.getInputStream()){bytes=in.readNBytes(MAX_BYTES+1);}catch(IOException e){throw unavailable();}
  if(bytes.length>MAX_BYTES)throw new BusinessException(ErrorCode.MEDIA_TOO_LARGE);
  String mime=detect(bytes);if(!mime.equals(image.getContentType()))throw invalid();
  Path target=file(id),temporary=target.resolveSibling(id+".part");if(Files.exists(target,LinkOption.NOFOLLOW_LINKS))throw invalid();
  try{Files.write(temporary,bytes,StandardOpenOption.CREATE_NEW,StandardOpenOption.WRITE);Files.move(temporary,target,StandardCopyOption.ATOMIC_MOVE);return new Stored(mime,bytes.length);}
  catch(IOException e){try{Files.deleteIfExists(temporary);}catch(IOException ignored){}throw unavailable();}
 }
 private String detect(byte[] b){
  if(b.length>=24&&b[0]==(byte)137&&b[1]==80&&b[2]==78&&b[3]==71&&b[4]==13&&b[5]==10&&b[6]==26&&b[7]==10&&b[12]==73&&b[13]==72&&b[14]==68&&b[15]==82){long w=big(b,16),h=big(b,20);if(w>0&&h>0&&w<=10000&&h<=10000&&w*h<=40000000)return "image/png";}
  if(b.length>=4&&b[0]==(byte)255&&b[1]==(byte)216&&b[2]==(byte)255&&b[b.length-2]==(byte)255&&b[b.length-1]==(byte)217)return "image/jpeg";
  if(b.length>=20&&b[0]=='R'&&b[1]=='I'&&b[2]=='F'&&b[3]=='F'&&b[8]=='W'&&b[9]=='E'&&b[10]=='B'&&b[11]=='P'&&b[12]=='V'&&b[13]=='P'&&b[14]=='8'&&(b[15]==' '||b[15]=='L'||b[15]=='X')){long n=0;for(int i=0;i<4;i++)n|=(long)(b[4+i]&255)<<(8*i);if(n==b.length-8)return "image/webp";}
  throw invalid();
 }
 private long big(byte[] b,int offset){long n=0;for(int i=0;i<4;i++)n=(n<<8)|(b[offset+i]&255);return n;}
 private Path root(){try{if(Files.isSymbolicLink(configuredRoot))throw invalid();Files.createDirectories(configuredRoot);return configuredRoot.toRealPath();}catch(IOException e){throw unavailable();}}
 private Path file(UUID id){if(id==null)throw invalid();Path root=root(),file=root.resolve(id+".bin").normalize();if(!file.getParent().equals(root)||Files.isSymbolicLink(file))throw invalid();return file;}
 public void removeUnpersistedOlderThan(java.time.Instant before,java.util.function.Predicate<UUID> persisted,int maxRemoved){
  int removed=0;try(var files=Files.newDirectoryStream(root())){for(var candidate:files){
   String name=candidate.getFileName().toString();if(!name.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(bin|part)")||!Files.isRegularFile(candidate,LinkOption.NOFOLLOW_LINKS)||!Files.getLastModifiedTime(candidate,LinkOption.NOFOLLOW_LINKS).toInstant().isBefore(before))continue;
   UUID id=UUID.fromString(name.substring(0,36));if(!persisted.test(id)){Files.deleteIfExists(candidate);if(++removed>=maxRemoved)break;}
  }}catch(IOException e){throw unavailable();}
 }
 public byte[] read(UUID id){Path file=file(id);try{if(!Files.isRegularFile(file,LinkOption.NOFOLLOW_LINKS)||Files.size(file)>MAX_BYTES)throw invalid();return Files.readAllBytes(file);}catch(IOException e){throw unavailable();}}
 public void delete(UUID id){try{Files.deleteIfExists(file(id));}catch(IOException e){throw unavailable();}}
 private BusinessException invalid(){return new BusinessException(ErrorCode.MEDIA_INVALID);}
 private BusinessException unavailable(){return new BusinessException(ErrorCode.DEPENDENCY_UNAVAILABLE);}
}
