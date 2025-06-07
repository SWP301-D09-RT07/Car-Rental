import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer
            style={{
                background: "#f1f3f6",
                color: "#232323",
                padding: "40px 0 0 0",
                borderTop: "1px solid #e0e0e0",
                fontFamily: "inherit",
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    padding: "0 24px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: 32,
                        alignItems: "flex-start",
                    }}
                >
                    {/* LOGO & INFO */}
                    <div style={{ flex: "2 1 320px", minWidth: 260 }}>
                        <div
                            className="logo-name-container"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <Link to="/">
                                <img
                                    src="/images/logo.png"
                                    alt="Carbook Logo"
                                    className="logo"
                                    style={{
                                        height: 40,
                                        marginRight: 12,
                                        background: "#fff",
                                        borderRadius: 6,
                                        border: "2px solid #e6efe7",
                                    }}
                                />
                            </Link>
                            <span
                                className="brand-name"
                                style={{
                                    color: "#36c6a5",
                                    fontWeight: 700,
                                    fontSize: 28,
                                    letterSpacing: 1,
                                }}
                            >
                                CAR RENTAL
                            </span>
                        </div>
                        <div style={{ fontSize: 18, marginBottom: 50, marginTop: 30 }}>
                            <div style={{ marginBottom: 4 }}>
                                Dịch vụ cho thuê xe tự lái hàng đầu Việt Nam.
                                <br />
                                Trải nghiệm lái xe an toàn, tiện lợi với đội xe đa dạng.
                            </div>
                            <div style={{ marginBottom: 2 }}>
                                <span>Email: </span>
                                <a href="mailto:info@carrental.vn" style={{ color: "#232323" }}>
                                    info@carrental.vn
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Địa điểm dịch vụ & hỗ trợ */}
                    <div style={{ flex: "1 1 180px", minWidth: 150 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 17 }}>
                            Địa điểm dịch vụ
                        </div>
                        <div style={{ fontSize: 15, lineHeight: 2, marginBottom: 14 }}>
                            <div>Đà Nẵng</div>
                            <div>Hồ Chí Minh</div>
                            <div>Hà Nội</div>
                            <div>Bình Dương</div>
                        </div>
                        <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 17 }}>
                            Hỗ trợ
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 6 }}>
                            <Link
                                to="/support"
                                style={{ color: "#232323", textDecoration: "none" }}
                            >
                                Quy định dịch vụ
                            </Link>
                        </div>
                        <div style={{ fontSize: 15, marginBottom: 6 }}>
                            <Link
                                to="/faq"
                                style={{ color: "#232323", textDecoration: "none" }}
                            >
                                Câu hỏi thường gặp
                            </Link>
                        </div>
                        <div style={{ color: "#43d6af", fontWeight: 600, fontSize: 18, display: "flex", alignItems: "center", gap: 6 }}>
                            <svg
                                width="20"
                                height="20"
                                fill="currentColor"
                                style={{ verticalAlign: "middle" }}
                                viewBox="0 0 24 24"
                            >
                                <path d="M20 15.5a1 1 0 0 0-1 1c0 1.93-2.14 3.5-6 3.5s-6-1.57-6-3.5a1 1 0 0 0-2 0c0 3.59 4.03 5.5 8 5.5s8-1.91 8-5.5a1 1 0 0 0-1-1z"></path>
                                <circle cx="12" cy="10" r="6"></circle>
                            </svg>
                            <span>1900 9999</span>
                        </div>
                    </div>

                    {/* Google Maps */}
                    <div style={{ flex: "2 1 400px", minWidth: 250, maxWidth: 500 }}>
                        <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 17 }}>
                            Google Maps
                        </div>
                        <div style={{
                            borderRadius: 12,
                            overflow: "hidden",
                            boxShadow: "0 2px 12px #0001",
                            minHeight: 220,
                            width: "100%",
                            maxWidth: 500
                        }}>
                            <iframe
                                title="Địa điểm Đại học FPT Đà Nẵng"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3833.8872692093785!2d108.24164181534495!3d16.0748569435527!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c8e9e1b0e1%3A0x3ea1801d0b5c1d4d!2zRGnhu4cgSOG7kyBGUFQgxJBhIE5hbmcsIEtodSDEkOG7iWMgRlBUIENpdHksIE5ndcOhIEjhuqNuaCBTxrDGoW4sIMSQw6AgTuG7mWkgTmFuaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1716866981752!5m2!1svi!2s"
                                width="100%"
                                height="240"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                            <div style={{
                                marginTop: 8,
                                fontSize: 15,
                                color: "#232323",
                                fontWeight: 500,
                                padding: "2px 0 0 2px"
                            }}>
                                <br/>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Copyright */}
            <div
                style={{
                    borderTop: "1px solid #e4e4e7",
                    marginTop: 36,
                    padding: "15px 0 10px 0",
                    fontSize: 15,
                    color: "#888",
                    textAlign: "center",
                }}
            >
                &copy; {new Date().getFullYear()} CAR RENTAL. Tất cả quyền được bảo lưu.
            </div>
        </footer>
    );
};

export default Footer;