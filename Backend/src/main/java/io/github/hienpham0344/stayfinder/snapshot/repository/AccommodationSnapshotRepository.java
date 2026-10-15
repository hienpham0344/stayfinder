package io.github.hienpham0344.stayfinder.snapshot.repository;
import io.github.hienpham0344.stayfinder.snapshot.entity.AccommodationSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface AccommodationSnapshotRepository extends JpaRepository<AccommodationSnapshot,UUID> {}
