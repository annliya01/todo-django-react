import { createContext,useState,useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";



const AuthContext = createContext();

export const AuthProvider = ({ children}) =>{
    const [username,setUsername] =useState(localStorage.getItem("username"||"Guest"));
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token")||null);
    const [refreshToken,setRefreshToken] = useState(localStorage.getItem("refresh")||null);
 
    const refreshAccessToken =useCallback( async () => {
        try {
            if (!refreshToken) return;
            const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/",{refresh: refreshToken});
            localStorage.setItem("token", res.data.access);
            setToken(res.data.access);
        }catch{
            alert("session expired");
            // localStorage.removeItem("token");
            // localStorage.removeItem("refresh");
            // setToken(null);
            // setUser(null);
            // Navigate("/login");
            logoutUser();
        }
    },[refreshToken]);

    const loginUser = (newAccess,newRefresh) => {
        const decodedUser = jwtDecode(newAccess);
        setUser(decodedUser)
        // console.log("Decoded User:", decodedUser);
        const username = decodedUser.username || "User";  

        localStorage.setItem("token",newAccess);
        //localStorage.setItem("refresh",newRefresh);
        setToken(newAccess);
        setRefreshToken(newRefresh)
        setUsername(username);
    };
    const logoutUser = () => {
        //console.log("Logging out...");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
    
        setToken(null);
        setUser(null);
        setRefreshToken(null);
        setUsername("Guest");
        window.location.href="/login";
    };
    useEffect(() => {
        try{
            if(token) {
                // console.log("Access Token:", token);
                const decodedUser =jwtDecode(token);
                setUser(decodedUser);
                //setUsername(localStorage.getItem("username") || "Guest");
    
                //localStorage.setItem("username", decodedUser.username || "Guest");
                const expireTime = decodedUser.exp * 1000;
                const timeUntilRefresh = expireTime - Date.now() - 60000; // 1 min before expiry
    
                if (timeUntilRefresh > 0) {
                    const timeout = setTimeout(() => refreshAccessToken(), timeUntilRefresh);
                    return () => clearTimeout(timeout);
                }
                else{
                    refreshAccessToken();
                }
            }} catch (error) {
                console.error("Error decoding token:", error);
                logoutUser();
            }
    },[token,refreshAccessToken]);
        
    

    return(
        <AuthContext.Provider value={{user,username, loginUser,logoutUser, token,refreshAccessToken}}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;