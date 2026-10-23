package io.github.hienpham0344.stayfinder.catalog.repository;
import io.github.hienpham0344.stayfinder.catalog.entity.Location;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import java.util.*;
public interface LocationRepository extends JpaRepository<Location,UUID> {
    @Query("select l from Location l where lower(concat(coalesce(l.city,''),' ',coalesce(l.country,''))) like lower(:query) order by l.city,l.id")
    List<Location> findSuggestions(@Param("query") String query,Pageable page);
}
