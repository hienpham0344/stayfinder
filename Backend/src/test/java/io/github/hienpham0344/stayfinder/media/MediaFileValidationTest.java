package io.github.hienpham0344.stayfinder.media;
import io.github.hienpham0344.stayfinder.media.service.LocalMediaStorage;
import io.github.hienpham0344.stayfinder.common.exception.BusinessException;
import org.junit.jupiter.api.*;import org.junit.jupiter.api.io.TempDir;import org.springframework.mock.web.MockMultipartFile;
import java.nio.file.*;import java.util.UUID;import static org.junit.jupiter.api.Assertions.*;
class MediaFileValidationTest{
 @TempDir Path root;
 static byte[] png(){return new byte[]{(byte)137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1};}
 @Test void storesGeneratedNameAndExactVerifiedMime(){var storage=new LocalMediaStorage(root);var id=UUID.randomUUID();var saved=storage.store(id,new MockMultipartFile("image","guest.png","image/png",png()));assertEquals("image/png",saved.mimeType());assertEquals(png().length,saved.sizeBytes());assertArrayEquals(png(),storage.read(id));assertTrue(Files.exists(root.resolve(id+".bin")));}
 @Test void rejectsMimeMismatchAndTraversalName(){var storage=new LocalMediaStorage(root);assertThrows(BusinessException.class,()->storage.store(UUID.randomUUID(),new MockMultipartFile("image","picture.jpg","image/jpeg",png())));assertThrows(BusinessException.class,()->storage.store(UUID.randomUUID(),new MockMultipartFile("image","../picture.png","image/png",png())));assertThrows(BusinessException.class,()->storage.store(UUID.randomUUID(),new MockMultipartFile("image","picture.svg","image/svg+xml","<svg/>".getBytes())));}
 @Test void rejectsOversizeAndEmpty(){var storage=new LocalMediaStorage(root);assertThrows(BusinessException.class,()->storage.store(UUID.randomUUID(),new MockMultipartFile("image","large.png","image/png",new byte[5*1024*1024+1])));assertThrows(BusinessException.class,()->storage.store(UUID.randomUUID(),new MockMultipartFile("image","empty.png","image/png",new byte[0])));}
 @Test void removalOnlyTargetsGeneratedOwnedFile(){var storage=new LocalMediaStorage(root);var a=UUID.randomUUID();var b=UUID.randomUUID();storage.store(a,new MockMultipartFile("image","a.png","image/png",png()));storage.store(b,new MockMultipartFile("image","b.png","image/png",png()));storage.delete(a);assertFalse(Files.exists(root.resolve(a+".bin")));assertArrayEquals(png(),storage.read(b));}
}
