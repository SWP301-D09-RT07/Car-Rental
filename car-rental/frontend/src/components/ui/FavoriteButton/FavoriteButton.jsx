import React, { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import { addFavorite, removeFavorite, getFavorites } from '@/services/api';
import { toast } from 'react-toastify';
import './FavoriteButton.scss';

const FavoriteButton = ({ carId, supplierId, initialIsFavorite = false, onFavoriteChange }) => {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleToggleFavorite = async (e) => {
        e.stopPropagation();
        if (isLoading) return;

        try {
            setIsLoading(true);
            setIsAnimating(true);
            console.log('[FavoriteButton] Toggle favorite:', { carId, supplierId, isFavorite });

            if (isFavorite) {
                const favorites = await getFavorites();
                const favoriteToRemove = favorites.find(f => f.carId === carId);
                if (favoriteToRemove) {
                    console.log('[FavoriteButton] Removing favorite:', favoriteToRemove);
                    await removeFavorite(favoriteToRemove.id);
                    setIsFavorite(false);
                    toast.success('Đã xóa khỏi danh sách yêu thích');
                }
            } else {
                console.log('[FavoriteButton] Adding favorite:', { carId, supplierId });
                const result = await addFavorite(carId, supplierId);
                console.log('[FavoriteButton] Add favorite result:', result);
                setIsFavorite(true);
                toast.success('Đã thêm vào danh sách yêu thích');
            }

            if (onFavoriteChange) {
                onFavoriteChange(!isFavorite);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra';
            toast.error(errorMessage);
            console.error('[FavoriteButton] Favorite error:', error);
        } finally {
            setIsLoading(false);
            setTimeout(() => setIsAnimating(false), 500); // Reset animation after 500ms
        }
    };

    return (
        <button
            onClick={handleToggleFavorite}
            disabled={isLoading}
            className={`favorite-button ${isFavorite ? 'active' : ''} ${isAnimating ? 'animating' : ''}`}
            title={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
        >
            {isLoading ? (
                <div className="loading-spinner" />
            ) : (
                <FaHeart className={`heart-icon ${isFavorite ? 'filled' : ''}`} />
            )}
        </button>
    );
};

export default FavoriteButton; 