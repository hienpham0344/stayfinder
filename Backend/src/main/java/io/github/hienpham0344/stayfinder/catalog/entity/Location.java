package io.github.hienpham0344.stayfinder.catalog.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;
@Entity @Table(name="locations") @Getter @Setter @NoArgsConstructor
public class Location {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    private String city;
    private String country;
}
