package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.ReportDTO;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingFinancialsRepository bookingFinancialsRepository;

    @Autowired
    private CarRepository carRepository;

    @Autowired
    private UserRepository userRepository;

    public ReportDTO getOverviewReport() {
        ReportDTO report = new ReportDTO();

        // Tổng doanh thu
        BigDecimal totalRevenue = bookingFinancialsRepository.findAll()
                .stream()
                .filter(bf -> !bf.getIsDeleted())
                .map(BookingFinancial::getTotalFare)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        report.setTotalRevenue(totalRevenue);

        // Tổng số lượt đặt
        Long totalBookings = bookingRepository.findAllByIsDeletedFalse()
                .stream()
                .count();
        report.setTotalBookings(totalBookings);

        // Xe phổ biến nhất với thông tin chi tiết
        ReportDTO.PopularCarDetailDTO popularCarDetail = bookingRepository.findAllByIsDeletedFalse()
                .stream()
                .collect(Collectors.groupingBy(b -> b.getCar().getId(), Collectors.counting()))
                .entrySet()
                .stream()
                .max((e1, e2) -> Long.compare(e1.getValue(), e2.getValue()))
                .flatMap(entry -> {
                    Integer carId = entry.getKey();
                    return carRepository.findById(carId).map(car -> {
                        ReportDTO.PopularCarDetailDTO detail = new ReportDTO.PopularCarDetailDTO();
                        detail.setCarId(carId.longValue());
                        detail.setCarModel(car.getModel());
                        detail.setLicensePlate(car.getLicensePlate());
                        detail.setBrandName(car.getBrand().getBrandName());
                        detail.setSupplierName(car.getSupplier().getUsername());
                        detail.setBookingCount(entry.getValue());
                        
                        // Tính tổng doanh thu của xe này
                        BigDecimal carRevenue = bookingRepository.findAllByIsDeletedFalse()
                                .stream()
                                .filter(b -> b.getCar().getId().equals(carId))
                                .map(b -> bookingFinancialsRepository.findByBookingIdAndIsDeletedFalse(b.getId())
                                        .stream()
                                        .findFirst()
                                        .map(BookingFinancial::getTotalFare)
                                        .orElse(BigDecimal.ZERO))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);
                        detail.setTotalRevenue(carRevenue);
                        
                        return detail;
                    });
                })
                .orElse(null);
        report.setPopularCarDetail(popularCarDetail);

        // Doanh thu theo tháng (12 tháng gần nhất)
        List<ReportDTO.MonthlyDataDTO> monthlyRevenue = generateMonthlyRevenueData();
        report.setMonthlyRevenue(monthlyRevenue);

        // Lượt đặt theo tháng (12 tháng gần nhất)
        List<ReportDTO.MonthlyDataDTO> monthlyBookings = generateMonthlyBookingsData();
        report.setMonthlyBookings(monthlyBookings);

        return report;
    }

    private List<ReportDTO.MonthlyDataDTO> generateMonthlyRevenueData() {
        List<ReportDTO.MonthlyDataDTO> monthlyData = new java.util.ArrayList<>();
        
        for (int i = 11; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(i);
            int month = yearMonth.getMonthValue();
            int year = yearMonth.getYear();
            
            BigDecimal monthlyRevenue = bookingFinancialsRepository.findAll()
                    .stream()
                    .filter(bf -> !bf.getIsDeleted())
                    .filter(bf -> {
                        LocalDate bookingDate = bf.getBooking().getStartDate();
                        return bookingDate.getMonthValue() == month && bookingDate.getYear() == year;
                    })
                    .map(BookingFinancial::getTotalFare)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            ReportDTO.MonthlyDataDTO data = new ReportDTO.MonthlyDataDTO();
            data.setMonth(month);
            data.setRevenue(monthlyRevenue);
            monthlyData.add(data);
        }
        
        return monthlyData;
    }

    private List<ReportDTO.MonthlyDataDTO> generateMonthlyBookingsData() {
        List<ReportDTO.MonthlyDataDTO> monthlyData = new java.util.ArrayList<>();
        
        for (int i = 11; i >= 0; i--) {
            YearMonth yearMonth = YearMonth.now().minusMonths(i);
            int month = yearMonth.getMonthValue();
            int year = yearMonth.getYear();
            
            Long monthlyBookings = bookingRepository.findAllByIsDeletedFalse()
                    .stream()
                    .filter(b -> {
                        LocalDate bookingDate = b.getStartDate();
                        return bookingDate.getMonthValue() == month && bookingDate.getYear() == year;
                    })
                    .count();
            
            ReportDTO.MonthlyDataDTO data = new ReportDTO.MonthlyDataDTO();
            data.setMonth(month);
            data.setCount(monthlyBookings);
            monthlyData.add(data);
        }
        
        return monthlyData;
    }
}