import React from 'react';
import styles from './LoadingSpinner.module.scss';

const LoadingSpinner = ({ size = 'medium' }) => {
    return (
        <div className={`${styles.spinner} ${styles[size]}`}>
            <div className={styles.spinnerInner}></div>
        </div>
    );
};

export default LoadingSpinner; 