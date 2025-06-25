import React from "react";

const Footer = () => {
    return (
        <footer
            style={{
                background: "#ffffff",
                color: "#374151",
                padding: "60px 0 0 0",
                borderTop: "4px solid #3B82F6",
                fontFamily: "inherit",
                position: "relative",
                boxShadow: "0 -4px 20px rgba(59, 130, 246, 0.1)",
            }}
        >
            {/* Background decoration */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"20\" r=\"1\" fill=\"%233B82F6\" opacity=\"0.06\"/><circle cx=\"80\" cy=\"80\" r=\"1\" fill=\"%233B82F6\" opacity=\"0.06\"/><circle cx=\"40\" cy=\"60\" r=\"1\" fill=\"%233B82F6\" opacity=\"0.06\"/><circle cx=\"60\" cy=\"40\" r=\"1\" fill=\"%233B82F6\" opacity=\"0.06\"/></svg>')",
                    backgroundSize: "80px 80px",
                    opacity: 0.5,
                }}
            />

            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "0 24px",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "50px",
                        marginBottom: "50px",
                    }}
                >
                    {/* LOGO & COMPANY INFO */}
                    <div style={{ gridColumn: "span 1" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "24px",
                            }}
                        >
                            <a href="/">
                                <img
                                    src="/images/logo.png"
                                    alt="Carbook Logo"
                                    style={{
                                        height: 48,
                                        marginRight: 16,
                                        background: "#3B82F6",
                                        borderRadius: 12,
                                        padding: "8px",
                                        boxShadow: "0 4px 16px rgba(59, 130, 246, 0.2)",
                                        transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.3)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.2)";
                                    }}
                                />
                            </a>
                            <span
                                style={{
                                    background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    fontWeight: 800,
                                    fontSize: 28,
                                    letterSpacing: 1.2,
                                }}
                            >
                                CAR RENTAL
                            </span>
                        </div>
                        
                        <div style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 28, color: "#6B7280" }}>
                            <p style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center" }}>
                                <span style={{ marginRight: 8, fontSize: 20 }}>🚗</span>
                                Dịch vụ cho thuê xe tự lái hàng đầu Việt Nam
                            </p>
                            <p style={{ margin: "0 0 16px 0", display: "flex", alignItems: "center" }}>
                                <span style={{ marginRight: 8, fontSize: 20 }}>✨</span>
                                Trải nghiệm lái xe an toàn, tiện lợi với đội xe đa dạng
                            </p>
                        </div>

                        {/* Contact Info */}
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                marginBottom: 16,
                                padding: "12px 16px",
                                background: "rgba(59, 130, 246, 0.05)",
                                borderRadius: 12,
                                border: "1px solid rgba(59, 130, 246, 0.1)",
                            }}>
                                <span style={{ marginRight: 12, fontSize: 20 }}>📧</span>
                                <a 
                                    href="mailto:info@carrental.vn" 
                                    style={{ 
                                        color: "#3B82F6", 
                                        textDecoration: "none",
                                        fontWeight: 500,
                                        fontSize: 15,
                                        transition: "color 0.3s ease",
                                    }}
                                    onMouseOver={(e) => e.target.style.color = "#1D4ED8"}
                                    onMouseOut={(e) => e.target.style.color = "#3B82F6"}
                                >
                                    info@carrental.vn
                                </a>
                            </div>
                            <div style={{ 
                                display: "flex", 
                                alignItems: "center",
                                padding: "12px 16px",
                                background: "rgba(59, 130, 246, 0.05)",
                                borderRadius: 12,
                                border: "1px solid rgba(59, 130, 246, 0.1)",
                            }}>
                                <span style={{ marginRight: 12, fontSize: 20 }}>📞</span>
                                <span style={{ 
                                    color: "#3B82F6", 
                                    fontWeight: 600, 
                                    fontSize: 16 
                                }}>
                                    1900 9999
                                </span>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
                                Kết nối với chúng tôi
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                {[
                                    { icon: "📘", name: "Facebook", color: "#1877F2" },
                                    { icon: "📷", name: "Instagram", color: "#E4405F" },
                                    { icon: "🐦", name: "Twitter", color: "#1DA1F2" },
                                    { icon: "💼", name: "LinkedIn", color: "#0A66C2" }
                                ].map((social, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: "50%",
                                            background: `linear-gradient(135deg, ${social.color}, ${social.color}dd)`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.transform = "translateY(-4px) scale(1.05)";
                                            e.target.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.transform = "translateY(0) scale(1)";
                                            e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                        }}
                                    >
                                        <span style={{ fontSize: 18 }}>{social.icon}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SERVICES & LOCATIONS */}
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#3B82F6" }}>
                            🌍 Địa điểm dịch vụ
                        </div>
                        <div style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
                            {["Đà Nẵng", "Hồ Chí Minh", "Hà Nội", "Bình Dương"].map((city, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        padding: "14px 18px",
                                        margin: "8px 0",
                                        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04))",
                                        borderRadius: 12,
                                        border: "1px solid rgba(59, 130, 246, 0.15)",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.08))";
                                        e.target.style.borderColor = "#3B82F6";
                                        e.target.style.transform = "translateX(4px)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04))";
                                        e.target.style.borderColor = "rgba(59, 130, 246, 0.15)";
                                        e.target.style.transform = "translateX(0)";
                                    }}
                                >
                                    <span style={{ marginRight: 10, fontSize: 16 }}>📍</span>
                                    <span style={{ fontWeight: 500, color: "#374151" }}>{city}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#3B82F6" }}>
                            🛠️ Dịch vụ hỗ trợ
                        </div>
                        <div style={{ fontSize: 15, lineHeight: 1.8 }}>
                            {[
                                { text: "Quy định dịch vụ", link: "/support", icon: "📋" },
                                { text: "Câu hỏi thường gặp", link: "/faq", icon: "❓" },
                                { text: "Hướng dẫn sử dụng", link: "/guide", icon: "📖" },
                                { text: "Chính sách bảo mật", link: "/privacy", icon: "🔒" }
                            ].map((item, index) => (
                                <div key={index} style={{ marginBottom: 12 }}>
                                    <a
                                        href={item.link}
                                        style={{
                                            color: "#6B7280",
                                            textDecoration: "none",
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 12px",
                                            borderRadius: 8,
                                            transition: "all 0.3s ease",
                                            fontWeight: 500,
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.color = "#3B82F6";
                                            e.target.style.background = "rgba(59, 130, 246, 0.05)";
                                            e.target.style.transform = "translateX(6px)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.color = "#6B7280";
                                            e.target.style.background = "transparent";
                                            e.target.style.transform = "translateX(0)";
                                        }}
                                    >
                                        <span style={{ marginRight: 10, fontSize: 16 }}>{item.icon}</span>
                                        {item.text}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* GOOGLE MAPS */}
                    <div>
                        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: "#3B82F6" }}>
                            📍 Vị trí của chúng tôi
                        </div>
                        <div style={{
                            borderRadius: 16,
                            overflow: "hidden",
                            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)",
                            marginBottom: 30,
                            border: "2px solid rgba(59, 130, 246, 0.1)",
                        }}>
                            <iframe
                                title="Địa điểm Đại học FPT Đà Nẵng"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.8872692093785!2d108.24164181534495!3d16.0748569435527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c8e9e1b0e1%3A0x3ea1801d0b5c1d4d!2zRGnhu4cgSOG7kyBGUFQgxJBhIE5hbmcsIEtodSDEkOG7iWMgRlBUIENpdHksIE5ndcOhIEjhuqNuaCBTxrDGoW4sIMSQw6AgTuG7mWkgTmFuaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1716866981752!5m2!1svi!2s"
                                width="100%"
                                height="220"
                                style={{ border: 0, filter: "brightness(0.95) contrast(1.05)" }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        {/* Contact Info Card */}
                        <div style={{ 
                            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))", 
                            padding: 24, 
                            borderRadius: 16,
                            border: "1px solid rgba(59, 130, 246, 0.1)",
                        }}>
                            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "#374151" }}>
                                📞 Liên hệ trực tiếp
                            </div>
                            <div style={{ color: "#6B7280", lineHeight: 1.6 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Giờ làm việc:</strong> 8:00 - 22:00 (Hàng ngày)
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Hotline:</strong> <span style={{ color: "#3B82F6", fontWeight: 600 }}>1900 9999</span>
                                </div>
                                <div>
                                    <strong>Email:</strong> <span style={{ color: "#3B82F6" }}>info@carrental.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Newsletter Signup */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04))",
                    padding: "36px",
                    borderRadius: 20,
                    border: "1px solid rgba(59, 130, 246, 0.15)",
                    marginBottom: 50,
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#374151" }}>
                        📬 Đăng ký nhận tin tức & ưu đãi
                    </div>
                    <div style={{ fontSize: 15, color: "#6B7280", marginBottom: 24 }}>
                        Nhận thông tin về các chương trình khuyến mãi và xe mới nhất
                    </div>
                    <div style={{ display: "flex", gap: 12, maxWidth: 450, margin: "0 auto", flexWrap: "wrap" }}>
                        <input
                            type="email"
                            placeholder="Nhập email của bạn..."
                            style={{
                                flex: 1,
                                minWidth: 250,
                                padding: "14px 18px",
                                borderRadius: 12,
                                border: "1px solid rgba(59, 130, 246, 0.3)",
                                background: "#ffffff",
                                color: "#374151",
                                fontSize: 15,
                                outline: "none",
                                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.1)",
                                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#3B82F6";
                                e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.2)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                e.target.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.1)";
                            }}
                        />
                        <button
                            style={{
                                padding: "14px 28px",
                                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: 15,
                                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                            }}
                            onMouseOver={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.4)";
                            }}
                            onMouseOut={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                            }}
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div
                style={{
                    borderTop: "1px solid rgba(59, 130, 246, 0.15)",
                    background: "rgba(59, 130, 246, 0.03)",
                    padding: "24px 0",
                    fontSize: 14,
                    color: "#6B7280",
                    textAlign: "center",
                }}
            >
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
                    <div style={{ marginBottom: 8, fontWeight: 500 }}>
                        &copy; {new Date().getFullYear()} CAR RENTAL. Tất cả quyền được bảo lưu.
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                        Thiết kế bởi Car Rental Team | 
                        <span style={{ margin: "0 8px" }}>•</span>
                        Phát triển với ❤️ tại Việt Nam
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;