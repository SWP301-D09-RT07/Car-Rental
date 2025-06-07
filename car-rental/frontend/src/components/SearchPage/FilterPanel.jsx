import { useState } from 'react';
import styles from './SearchPage.module.scss';

const FilterPanel = ({ onFilterChange }) => {
    const [selectedBrand, setSelectedBrand] = useState('');
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [features, setFeatures] = useState([]);
    const [seats, setSeats] = useState('');

    const handleFeatureChange = (feature) => {
        setFeatures(prev =>
            prev.includes(feature)
                ? prev.filter(f => f !== feature)
                : [...prev, feature]
        );
    };

    const handleApplyFilters = () => {
        const filters = {
            brand: selectedBrand || undefined,
            priceMin: priceRange[0],
            priceMax: priceRange[1],
            region: selectedRegion || undefined,
            features: features.length > 0 ? features : undefined,
            seats: seats || undefined,
        };
        onFilterChange(filters);
    };

    return (
        <div className={styles.filterPanel}>
            <h2 className={styles.filterTitle}>Bộ lọc nâng cao</h2>
            <div className={styles.filterGroup}>
                <label className={styles.label}>Loại xe:</label>
                <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className={styles.select}
                >
                    <option value="">Tất cả</option>
                    <option value="Toyota">Toyota</option>
                    <option value="Honda">Honda</option>
                    <option value="VinFast">VinFast</option>
                </select>
            </div>
            <div className={styles.filterGroup}>
                <label className={styles.label}>Giá thuê (VND/ngày):</label>
                <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="50000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className={styles.range}
                />
                <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="50000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className={styles.range}
                />
                <p className={styles.rangeText}>
                    Từ {priceRange[0].toLocaleString()} đến {priceRange[1].toLocaleString()} VND
                </p>
            </div>
            <div className={styles.filterGroup}>
                <label className={styles.label}>Địa điểm:</label>
                <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className={styles.select}
                >
                    <option value="">Tất cả</option>
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP.HCM">TP.HCM</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
            </div>
            <div className={styles.filterGroup}>
                <label className={styles.label}>Tiện nghi:</label>
                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={features.includes('GPS')}
                        onChange={() => handleFeatureChange('GPS')}
                    />
                    GPS
                </label>
                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={features.includes('Bluetooth')}
                        onChange={() => handleFeatureChange('Bluetooth')}
                    />
                    Bluetooth
                </label>
            </div>
            <div className={styles.filterGroup}>
                <label className={styles.label}>Số chỗ ngồi:</label>
                <select
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className={styles.select}
                >
                    <option value="">Tất cả</option>
                    <option value="4">4 chỗ</option>
                    <option value="5">5 chỗ</option>
                    <option value="7">7 chỗ</option>
                </select>
            </div>
            <button
                onClick={handleApplyFilters}
                className={styles.applyButton}
            >
                Áp dụng lọc
            </button>
        </div>
    );
};

export default FilterPanel;