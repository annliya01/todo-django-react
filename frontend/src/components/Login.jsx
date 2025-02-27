import { useState, useContext, useEffect } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
    const [formData, setFormData] = useState({ username: "", password: "" });
    const { loginUser, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(formData);
            const newAccess = response.data.access;
            const newRefresh = response.data.refresh;

            loginUser(newAccess, newRefresh);
            
        } catch (error) {
            console.error("Login Error", error.response ? error.response.data : error);
            toast.error("Invalid credentials");
        }
    };

    useEffect(() => {
        if (token) {
            navigate("/todo");
        }
    }, [token, navigate]);

    return (
        <div>
            <form className="formcont" onSubmit={handleSubmit}>
                <h3 className="form-title">Login</h3>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                <button type="submit">Login</button>
                <p><a href="/forgot-password">Forgot Password?</a></p>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Login;
