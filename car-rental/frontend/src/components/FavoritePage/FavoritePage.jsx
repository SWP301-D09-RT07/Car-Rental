import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFavorites, removeFavorite } from '../../services/api';
import { toast } from 'react-toastify';
import './FavoritePage.scss';

const FavoritePage = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const data = await getFavorites();
            setFavorites(data);
        } catch (error) {
            toast.error(error.message || 'Lấy danh sách yêu thích thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (favoriteId) => {
        try {
            await removeFavorite(favoriteId);
            setFavorites(favorites.filter((fav) => fav.favoriteId !== favoriteId));
            toast.success('Xóa yêu thích thành công');
        } catch (error) {
            toast.error(error.message || 'Xóa yêu thích thất bại');
        }
    };

    const handleViewDetails = (fav) => {
        if (fav.carId) {
            navigate(`/cars/${fav.carId}`);
        } else if (fav.supplierId) {
            navigate(`/supplier/${fav.supplierId}`);
        }
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="favorite-page">
            <h1 className="title">Danh Sách Yêu Thích</h1>
            <div className="card">
                {favorites.length === 0 ? (
                    <p className="empty">Chưa có xe hoặc nhà cung cấp yêu thích.</p>
                ) : (
                    <div className="favorites-grid">
                        {favorites.map((fav) => (
                            <div key={fav.favoriteId} className="favorite-item">
                                <img
                                    src={fav.car?.imageUrl || fav.supplier?.logo || 'https://via.placeholder.com/80'}
                                    alt={fav.car?.model || fav.supplier?.name || 'Favorite'}
                                    className="favorite-image"
                                />
                                <div className="info">
                                    <p className="name">{fav.car?.model || fav.supplier?.name || 'N/A'}</p>
                                    <div className="actions">
                                        <button
                                            onClick={() => handleViewDetails(fav)}
                                            className="btn view-btn"
                                        >
                                            Xem Chi Tiết
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFavorite(fav.favoriteId)}
                                            className="btn remove-btn"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritePage;