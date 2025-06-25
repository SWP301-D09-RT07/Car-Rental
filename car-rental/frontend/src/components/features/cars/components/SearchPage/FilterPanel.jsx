import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaFilter, FaUndo, FaCar, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaGasPump, FaChair } from 'react-icons/fa';
import styles from './SearchPage.module.scss';

import ErrorMessage from '@/components/Common/ErrorMessage/ErrorMessage';
import LoadingSpinner from "@/components/Common/Loading/LoadingSpinner.jsx";

const FilterPanel = ({ onFilterChange, brands, countries, regions, seatOptions, priceRanges, years, fuelTypes, initialFilters, isLoading }) => {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            brand: '',
            countryCode: '',
            regionId: '',
            seats: '',
            priceRange: '',
            year: '',
            fuelType: '',
            sortBy: '',
        }
    });

    const selectedCountry = watch('countryCode');

    useEffect(() => {
        if (initialFilters) {
            setValue('regionId', initialFilters.regionId || '');
            setValue('countryCode', initialFilters.countryCode || '');
        }
    }, [initialFilters, setValue]);

    const onSubmit = (data) => {
        const filters = {
            ...data,
            pickupDate: initialFilters?.pickupDate,
            dropoffDate: initialFilters?.dropoffDate,
            pickupTime: initialFilters?.pickupTime,
            dropoffTime: initialFilters?.dropoffTime,
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => {
            if (filters[key] === '') {
                delete filters[key];
            }
        });

        onFilterChange(filters);
        toast.success('Đã áp dụng bộ lọc');
    };

    const handleReset = () => {
        reset();
        onFilterChange({});
        toast.info('Đã xóa bộ lọc');
    };

    if (isLoading) {
        return (
            <div className={styles.filters}>
                <div className={styles.filterSection}>
                    <LoadingSpinner size="large" />
                    <p>Đang tải bộ lọc...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.filters}>
            <div className={styles.filterSection}>
                <h3>
                    <FaFilter /> Bộ lọc tìm kiếm
                </h3>
                
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.filterGroup}>
                        <label>
                            <FaCar /> Hãng xe
                        </label>
                        <select
                            {...register('brand')}
                            className={styles.filterSelect}
                            aria-label="Chọn hãng xe"
                        >
                            <option value="">Tất cả hãng</option>
                            {brands.map((brand) => (
                                <option key={brand.carBrandId} value={brand.brandName}>
                                    {brand.brandName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            <FaMapMarkerAlt /> Địa điểm
                        </label>
                        <select
                            {...register('countryCode')}
                            className={styles.filterSelect}
                            aria-label="Chọn quốc gia"
                        >
                            <option value="">Tất cả quốc gia</option>
                            {countries.map((country) => (
                                <option key={country.countryCode} value={country.countryCode}>
                                    {country.countryName}
                                </option>
                            ))}
                        </select>

                        <select
                            {...register('regionId')}
                            disabled={!selectedCountry}
                            className={styles.filterSelect}
                            aria-label="Chọn khu vực"
                        >
                            <option value="">Tất cả khu vực</option>
                            {regions.map((region) => (
                                <option key={region.regionId} value={region.regionId}>
                                    {region.regionName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            <FaChair /> Số ghế
                        </label>
                        <select
                            {...register('seats')}
                            className={styles.filterSelect}
                            aria-label="Chọn số ghế"
                        >
                            <option value="">Tất cả</option>
                            {seatOptions.map((seats) => (
                                <option key={seats} value={seats}>
                                    {seats} chỗ
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            <FaMoneyBillWave /> Khoảng giá
                        </label>
                        <select
                            {...register('priceRange')}
                            className={styles.filterSelect}
                            aria-label="Chọn khoảng giá"
                        >
                            <option value="">Tất cả giá</option>
                            {priceRanges.map((range) => (
                                <option key={range} value={range}>
                                    {range}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            <FaCalendarAlt /> Năm sản xuất
                        </label>
                        <select
                            {...register('year')}
                            className={styles.filterSelect}
                            aria-label="Chọn năm sản xuất"
                        >
                            <option value="">Tất cả năm</option>
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>
                            <FaGasPump /> Loại nhiên liệu
                        </label>
                        <select
                            {...register('fuelType')}
                            className={styles.filterSelect}
                            aria-label="Chọn loại nhiên liệu"
                        >
                            <option value="">Tất cả loại</option>
                            {fuelTypes.map((fuelType) => (
                                <option key={fuelType.fuelTypeId} value={fuelType.fuelTypeName}>
                                    {fuelType.fuelTypeName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Sắp xếp theo</label>
                        <select
                            {...register('sortBy')}
                            className={styles.filterSelect}
                            aria-label="Sắp xếp theo"
                        >
                            <option value="">Mặc định</option>
                            <option value="price-low">Giá thấp đến cao</option>
                            <option value="price-high">Giá cao đến thấp</option>
                            <option value="name">Tên A-Z</option>
                        </select>
                    </div>

                    <div className={styles.filterActions}>
                        <button type="submit" className={styles.apply}>
                            <FaFilter /> Áp dụng
                        </button>
                        <button type="button" onClick={handleReset} className={styles.reset}>
                            <FaUndo /> Đặt lại
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FilterPanel;