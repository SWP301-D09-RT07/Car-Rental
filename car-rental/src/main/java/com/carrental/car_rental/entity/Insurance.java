package com.carrental.car_rental.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.Nationalized;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;

@Getter
@Setter
@Entity
public class Insurance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "insurance_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Size(max = 50)
    @NotNull
    @Column(name = "policy_number", nullable = false, length = 50)
    private String policyNumber;

    @Size(max = 100)
    @NotNull
    @Nationalized
    @Column(name = "provider", nullable = false, length = 100)
    private String provider;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @NotNull
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Size(max = 500)
    @Nationalized
    @Column(name = "coverage_details", length = 500)
    private String coverageDetails;

    @ColumnDefault("0")
    @Column(name = "is_deleted")
    private Boolean isDeleted;

}