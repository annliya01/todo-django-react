import { useState} from "react";
import { signup, checkUsername, checkEmail } from "../api";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
    const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmpassword: "" });
    const [usernameError, setUsernameError] = useState(null);
    const [emailError, setEmailError] = useState(null);
    const [passwordError, setPasswordError] = useState(null); 
    const [confirmPasswordError, setConfirmPasswordError] = useState(null); 
    const navigate = useNavigate();

    const isValidPassword = /^(?=.*?[0-9])(?=.*?[A-Za-z]).{8,32}$/;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === "username") {
            checkUsernameAvailability(value);
        }

        if (name === "email") {
            checkEmailAvailability(value);
        }
        if (name === "password") {
            if (!isValidPassword.test(value)) {
                setPasswordError("Password must be 8-32 characters long, contain at least one digit and one letter.");
            } else {
                setPasswordError(null);
            }
        }
        if (name === "confirmpassword") {
            if (value !== formData.password) {
                setConfirmPasswordError("Passwords do not match.");
            } else {
                setConfirmPasswordError(null);
            }
        }
    };

    const checkUsernameAvailability = async (username) => {
        try {
            const response = await checkUsername(username);
            if (response.data.taken) {
                setUsernameError("Username is already taken");
            } else {
                setUsernameError(null);
            }
        } catch (error) {
            console.error("Username Check Error", error);
        }
    };

    const checkEmailAvailability = async (email) => {
        try {
            const response = await checkEmail(email);
            if (response.data.taken) {
                setEmailError("Email is already taken");
            } else {
                setEmailError(null);
            }
        } catch (error) {
            console.error("Email Check Error", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!usernameError && !emailError &&!passwordError) {
            try {
                await signup(formData);
                toast.success("Signup Successful!");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } catch (error) {
                const errorMessage = error.response?.data?.error || "Signup failed!";
                toast.error(errorMessage);
            }
        } else {
            toast.error("Please fix the errors before submitting");
        }
    };

    return (
        <div>
            <form className="formcont" onSubmit={handleSubmit}>
                <h3 className="form-title">SignUp</h3>
                <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
                {usernameError && <p style={{ color: "red", fontSize:10 ,textAlign: "left"}}>{usernameError}</p>}
                <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
                {emailError && <p style={{ color: "red" ,fontSize:10,textAlign: "left"}}>{emailError}</p>}
                <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
                {passwordError && <p style={{ color: "red", fontSize:10,textAlign: "left"}}>{passwordError}</p>}
                <input type="password" name="confirmpassword" placeholder="Confirm Password" onChange={handleChange} required />
                {confirmPasswordError && <p style={{ color: "red", fontSize:10,textAlign: "left"}}>{confirmPasswordError}</p>} 
                <button type="submit">Signup</button>
            </form>
            <ToastContainer />
        </div>
    );
};

export default Signup;
