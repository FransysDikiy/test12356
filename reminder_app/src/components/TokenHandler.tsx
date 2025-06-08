import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const TokenHandler = () => {
    const navigate = useNavigate();
    const { setUser, setIsAuthenticated, logout } = useAuth();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (token) {
            localStorage.setItem("token", token);

            getUserData()
                .then((res) => {
                    if (res?.data) {
                        localStorage.setItem("user", JSON.stringify(res.data));
                        setUser(res.data);
                        setIsAuthenticated(true);
                        navigate("/");
                    } else {
                        logout();
                        navigate("/login");
                    }
                })
                .catch(() => {
                    logout();
                    navigate("/login");
                });
        } else {
            navigate("/login");
        }
    }, [navigate, setUser, setIsAuthenticated, logout]);

    return null;
};

export default TokenHandler;


