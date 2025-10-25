import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import logoImage from "../logo/medical-logo.svg";
import billbg from "../logo/medical-background.svg";
import config from "../config";

const Login = () => {
  const history = useHistory();

  const [loginData, setLoginData] = useState({
    loginIdentifier: "",
    password: "",
  });

  const [alertMessage, setAlertMessage] = useState(null); 
  const [color, setcolor] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsButtonDisabled(true); 
    
    try {
      const response = await axios.post(
        `${config.apiUrl}/login`,
        loginData
      );
      // console.log(response.data);
      if (response.data.status === 200) {
        setAlertMessage("Login Successful!");
        setcolor(true);
        setTimeout(() => {
          setAlertMessage(null); 
          localStorage.setItem("user", JSON.stringify(response.data.data));
          history.push("/sidebar");
          window.location.reload();
          setIsButtonDisabled(false); 
        }, 2000);
      }
    } 
  catch (error) {
    console.error("Login failed:", error);
    if (error.response && error.response.status === 401) {
      const errorMessage = error.response.data.message;
      if (errorMessage === "Invalid username or password") {
        setAlertMessage("Invalid username or password");
      } else if (errorMessage === "Invalid username") {
        setAlertMessage("Invalid username or password");
      } else if (errorMessage === "Invalid password") {
        setAlertMessage("Invalid password.");
      } else {
        setAlertMessage("An unexpected error occurred. Please try again.");
      }
      setTimeout(() => {
        setAlertMessage(null);
      }, 2000);
    } else {
      console.error("An unexpected error occurred:", error);
      setAlertMessage("An unexpected error occurred. Please try again.");
      setTimeout(() => {
        setAlertMessage(null); 
      }, 2000);
    }
    setIsButtonDisabled(false);
  }
  };

  const alertStyle = {
    position: "fixed",
    top: "10px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: color?"green":"red" , 
    color: "white",
    padding: "10px",
    borderRadius: "5px",
    boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.2)",
    zIndex: "9999",
    display: alertMessage ? "block" : "none", 
    opacity: alertMessage ? 1 : 0, 
    transition: "opacity 0.5s ease-in-out", 
  };
  
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        backgroundImage: `url(${billbg})`,
        backgroundSize: "cover",
        backgroundRepeat: "repeat",
        backgroundPosition: "0 0",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        fontFamily: 'serif',
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        className="p-4 border-0 shadow"
        style={{ 
          minWidth: "350px", 
          maxWidth: "450px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(5px)",
          borderRadius: "15px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          position: "relative",
          zIndex: 10
        }}
      >
        <div className="text-center mb-4">
          <img
            src={logoImage}
            alt="Profile"
            style={{ width: "100px", height: "100px", borderRadius: "50%" }}
          />
          <div className="text-center">
            <h1 className="clinic-logo-main mb-1" style={{ 
              fontSize: '42px', 
              margin: '0'
            }}>
              AROHA
            </h1>
            <h3 className="clinic-logo-sub mb-2" style={{ 
              fontSize: '14px', 
              margin: '0'
            }}>
              SKIN HAIR & WELLNESS CLINIC
            </h3>
            <div className="clinic-logo-accent" style={{ width: '80px', margin: '8px auto 12px' }}></div>
            <p className="text-secondary" style={{ fontSize: '12px', marginTop: '8px', color: '#6c757d', fontWeight: '500' }}>
              Professional Healthcare Management Platform
            </p>
          </div>
        </div>
        <div style={alertStyle}>{alertMessage}</div>

        
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="loginIdentifier" className="form-label">
              <b>Email/Mobile number</b>
            </label>
            <input
              type="text"
              id="loginIdentifier"
              name="loginIdentifier"
              placeholder="Email or Mobile Number"
              className="form-control"
              value={loginData.loginIdentifier}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              <b>Password</b>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className="form-control"
              value={loginData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="text-center">
            <button type="submit"
             className="btn"
              style={{backgroundColor:'teal', color:'white'}}
              disabled={isButtonDisabled}>
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
