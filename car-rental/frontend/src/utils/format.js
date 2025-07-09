import { CURRENCY, CURRENCY_SYMBOL } from '../config/constants';

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = CURRENCY) => {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format number
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
  if (!number && number !== 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{3})(\d{3})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return phone;
};

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (!value && value !== 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Format credit card number
 * @param {string} number - Credit card number
 * @returns {string} Formatted credit card number
 */
export const formatCreditCard = (number) => {
  if (!number) return '';
  const cleaned = number.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{4})(\d{4})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return number;
};

/**
 * Format name (capitalize first letter of each word)
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
export const formatName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format address
 * @param {string} address - Address to format
 * @returns {string} Formatted address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part)
    .join(', ');
<<<<<<< HEAD
};

/**
 * Format VND currency
 * @param {number} amount - Amount to format
 * @param {boolean} compact - Use compact format (1M instead of 1,000,000)
 * @returns {string} Formatted VND currency string
 */
export const formatVND = (amount, compact = false) => {
  if (!amount && amount !== 0) return '0 ₫';
  
  if (compact && amount >= 1000000) {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B ₫`;
    }
    const millions = amount / 1000000;
    return `${millions.toFixed(1)}M ₫`;
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format compact VND currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Compact VND currency string
 */
export const formatCompactVND = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B ₫`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ₫`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K ₫`;
  }
  return `${amount.toLocaleString('vi-VN')} ₫`;
};

/**
 * Format VND with custom symbol
 * @param {number} amount - Amount to format
 * @param {string} symbol - Currency symbol (default: ₫)
 * @returns {string} Formatted currency with custom symbol
 */
export const formatVNDWithSymbol = (amount, symbol = '₫') => {
  if (!amount && amount !== 0) return `0 ${symbol}`;
  
  return `${amount.toLocaleString('vi-VN')} ${symbol}`;
};

/**
 * Format price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {boolean} compact - Use compact format
 * @returns {string} Formatted price range
 */
export const formatPriceRange = (minPrice, maxPrice, compact = true) => {
  if (!minPrice && !maxPrice) return '';
  
  const formatFunc = compact ? formatCompactVND : formatVND;
  
  if (!minPrice) return `Dưới ${formatFunc(maxPrice)}`;
  if (!maxPrice) return `Từ ${formatFunc(minPrice)}`;
  
  return `${formatFunc(minPrice)} - ${formatFunc(maxPrice)}`;
};

/**
 * Format discount price
 * @param {number} originalPrice - Original price
 * @param {number} discountPercent - Discount percentage
 * @param {boolean} compact - Use compact format
 * @returns {object} Object with formatted original and discounted prices
 */
export const formatDiscountPrice = (originalPrice, discountPercent, compact = false) => {
  if (!originalPrice || !discountPercent) {
    return {
      original: formatVND(originalPrice, compact),
      discounted: formatVND(originalPrice, compact),
      discount: '0%'
    };
  }
  
  const discountedPrice = originalPrice * (1 - discountPercent / 100);
  
  return {
    original: formatVND(originalPrice, compact),
    discounted: formatVND(discountedPrice, compact),
    discount: `${discountPercent}%`,
    savings: formatVND(originalPrice - discountedPrice, compact)
  };
};
=======
}; 
>>>>>>> supplier
