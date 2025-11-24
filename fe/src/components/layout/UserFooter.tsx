import { Link } from "react-router-dom";
import { FaFacebookF, FaYoutube, FaTiktok } from "react-icons/fa";
import "./Layout.css";

const UserFooter = () => {
  return (
    <footer className="user-footer">
      <div className="footer-inner" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div className="footer-top">
          <div className="footer-logo">
            <h2>VicEdu</h2>
            <p className="slogan">Học thông minh hơn – Hướng đến tương lai.</p>
          </div>

          <div className="footer-links">
            <Link to="/about">Giới thiệu</Link>
            <Link to="/terms">Điều khoản</Link>
            <Link to="/privacy">Bảo mật</Link>
            <Link to="/contact">Liên hệ</Link>
          </div>

          <div className="footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
              <FaYoutube />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
              <FaTiktok />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2025 VicEdu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default UserFooter;
