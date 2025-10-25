import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import logoImage from "../logo/medical-logo.svg";
import profileImg from "../logo/medical-profile.svg";
import config from "../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faCashRegister,
  faPlus,
  faBoxes,
  faFileMedical,
  faStore,
  faMoneyBillTransfer,
  faIdCard,
} from "@fortawesome/free-solid-svg-icons";
import StockDetailsPage from "./stock";
import AddMedicine from "./addmedicine";
import Billing from "./billing";
import ConsultationForm from "./consultationform";
import Purchase from "./purchase";
import BillingHis from "./billinghistory";
import RegistrationForm from "./registration";
import StockDetailsPage1 from "./pharmacystock";
import { BiChevronUp, BiChevronDown } from "react-icons/bi";
import "bootstrap/dist/css/bootstrap.min.css";

const UserProfile = ({ user, onLogout }) => {
  const history = useHistory();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

   const handleLogout = async () => {
    const logoutEventData = {
      userId: user.user.user_id,
      userFirstName: user.user.user_first_name,
      userLastName: user.user.user_last_name,
      userRole: user.user.user_role,
    };
    setIsButtonDisabled(true); 
    try {
      const response = await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logoutEventData),
      });

      const result = await response.json();

      if (response.status === 200) {
        localStorage.removeItem("user");
        history.push("/");
        window.location.reload();
        setIsButtonDisabled(false); 
        onLogout();
      } else {
        console.error("Error logging logout event:", result.message);
      }
    } catch (error) {
      console.error("Error logging logout event:", error.message);
    }
  };

  return (
    <div className="flex-grow-0" style={{ fontFamily: "serif, sans-serif" }}>
      <div className="d-flex align-items-center ">
        <img
          src={profileImg}
          alt="Profile"
          style={{
            width: "50px",
            height: "60px",
            marginRight: "5px",
            borderRadius: "50%",
            marginBottom: "15px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ lineHeight: "2px" }}>
            <h6>
              <b> {user ? ` ${user.user.user_role} ` : "Guest"}</b>
            </h6>
            <h6>
              <b>
                {" "}
                {` ${user.user.user_first_name} ${user.user.user_last_name} `}
              </b>
            </h6>
            <p style={{ fontSize: "14px" }}>
              {user ? user.user.user_email : ""}
            </p>
          </div>
          <div style={{ marginTop: "-20px" }}>
            <button className="btn btn-icon" onClick={handleLogout}
            disabled={isButtonDisabled}>
              <FontAwesomeIcon icon={faSignOutAlt} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showBillingHis, setShowBillingHis] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showStockDetails1, setShowStockDetails1] = useState(false);
  const history = useHistory();
  const [activeMenu, setActiveMenu] = useState(null);

  const handleMenuClick = (menuName) => {
    setActiveMenu(menuName);
    activateMenu(menuName);
  };

  const activateMenu = (menuName) => {
    const menuItems = document.querySelectorAll('.sidebar ul li ');
    menuItems.forEach((menuItem) => {
      menuItem.classList.remove('active');
    });

    const activatedMenu = document.querySelector(`.sidebar ul li [data-menu="${menuName}"]`);
    if (activatedMenu) {
      activatedMenu.closest('li').classList.add('active');
    }
  };

  const handleRegistrationFormToggle = () => {
    if (user && user.user.user_role === "Doctor") {
      setShowRegistrationForm(true);
      setShowBilling(false);
      setShowStockDetails(false);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(false);
    }
  };
  const handleStockDetailsToggle1 = () => {
    if (user && user.user.user_role === "Pharmacist") {
      setShowBilling(false);
      setShowStockDetails(false);
      setShowStockDetails1(true);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };

  const handleStockDetailsToggle = () => {
    if (
      (user && user.user.user_role === "Pharmacist") ||
      user.user.user_role === "Doctor"
    ) {
      setShowBilling(false);
      setShowStockDetails(true);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };
  const handleBillingToggle = () => {
    if (
      (user && user.user.user_role === "Pharmacist") ||
      user.user.user_role === "Doctor"
    ) {
      setShowBilling(true);
      setShowStockDetails(false);
      setShowStockDetails1(false);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };
  const handleAddMedicineToggle = () => {
    if (user && user.user.user_role === "Doctor") {
      setShowBilling(false);
      setShowStockDetails(false);
      setShowAddMedicine(true);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };

  const handleFormToggle = () => {
    if (user && user.user.user_role === "Doctor") {
      setShowBilling(false);
      setShowStockDetails(false);
      setShowAddMedicine(false);
      setShowForm(true);
      setShowPurchase(false);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };

  const handlePurchaseToggle = () => {
    if (user && user.user.user_role === "Doctor") {
      setShowBilling(false);
      setShowStockDetails(false);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(true);
      setShowBillingHis(false);
      setShowRegistrationForm(false);
    }
  };

  const handleBillingHisToggle = () => {
    if (user && user.user.user_role === "Doctor") {
      setShowBilling(false);
      setShowStockDetails(false);
      setShowAddMedicine(false);
      setShowForm(false);
      setShowPurchase(false);
      setShowBillingHis(true);
      setShowRegistrationForm(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setShowBilling(true);
        setActiveMenu('billing');
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    history.push("/");
    window.location.reload();
  };
  return (
    <div
      className="container-fluid"
      style={{ fontFamily: "serif, sans-serif" }}
    >

      <style>
        {
          `
        .sidebar ul li {
            padding:5px;
            border-radius: 5px;
            width:100%;
            transition: background-color 0.3s;
        }

        .sidebar ul li:hover{
            background-color: #ebe6e6;
        }

        .sidebar ul li:active,
        .sidebar ul li.active {
          background-color: #c2c2c2;
        } 
    `
        }
      </style>

      <div className="row">
        <div className="col-lg-3 col-md-4">
          <div className="shadow-sm p-3  h-100 bg-white rounded">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3" style={{ width: 'fit-content', margin: '0 auto', minWidth: '260px' }}>
                <img
                  src={logoImage}
                  alt="Clinic Logo"
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    marginRight: "20px"
                  }}
                />
                <div className="text-left">
                  <h3 className="clinic-logo-main mb-1" style={{ 
                    fontSize: '32px', 
                    margin: '0',
                    fontWeight: 'bold'
                  }}>
                    AROHA
                  </h3>
                  <h5 className="clinic-logo-sub mb-2" style={{ 
                    fontSize: '10px', 
                    margin: '0',
                    whiteSpace: 'nowrap',
                    fontWeight: '500',
                    letterSpacing: '0.3px'
                  }}>
                    SKIN HAIR & WELLNESS CLINIC
                  </h5>
                  <div className="clinic-logo-accent" style={{ width: '70px', margin: '8px 0 0' }}></div>
                </div>
              </div>
              <div className="w-100 text-center">
                <p className="mb-1" style={{ fontSize: "13px", color: '#6c757d', fontWeight: '400' }}>
                  584, 1st floor, Karumbalai main road,<br />
                  Kk nagar, Madurai - 625020
                </p>
                <p className="mb-0" style={{ fontSize: "12px", color: '#6c757d', fontWeight: '500' }}>
                  Contact: 8870321445, 7695959776
                </p>
              </div>
            </div>

            <div className="col-12 ">
              <button
                className="btn text-dark w-100 mb-3 text "
                style={{ backgroundColor: "teal", color: "white" }}
                onClick={handleToggle}
                type="button"
                aria-expanded={isOpen}
              >
                <b style={{ color: "white" }}>MENU</b>{" "}
                {isOpen ? <BiChevronUp /> : <BiChevronDown />}
              </button>
              <div className={`collapse${isOpen ? " show" : ""} `}>
                <div className="d-flex justify-content-center font-size-14 sidebar">
                  <ul
                    className=" container-fluid  list-unstyled  mb-3"
                    style={{ lineHeight: "21px" }}
                  >
                    {user &&
                      (user.user.user_role === "Pharmacist" ||
                        user.user.user_role === "Doctor") && (
                        <li className={activeMenu === 'billing' ? 'active' : ''}
                        onClick={() => {
                          handleBillingToggle();
                          handleMenuClick('billing')
                        }}>
                          <span
                            className="text-decoration-none text-dark"
                            data-menu="billing"
                          >
                            <FontAwesomeIcon
                              icon={faCashRegister}
                              className="me-3"
                            />
                            <b>Billing</b>
                          </span>
                        </li>
                      )}

                    {user && user.user.user_role === "Pharmacist" && (
                      <li className={activeMenu === 'stockDetails' ? 'active' : ''}
                      onClick={() => {
                        handleStockDetailsToggle1();
                        handleMenuClick('stockDetails')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="stockDetails"
                        >
                          <FontAwesomeIcon icon={faBoxes} className="me-3" />{" "}
                          <b>Stock Details</b>
                        </span>
                      </li>
                    )}

                    <br />

                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'addmedicine' ? 'active' : ''}
                      onClick={() => {
                        handleAddMedicineToggle();
                        handleMenuClick('addmedicine')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="addmedicine"
                        >
                          <FontAwesomeIcon icon={faPlus} className="me-3" />
                          <b>Add Medicine</b>
                        </span>
                      </li>
                    )}

                    <br />

                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'consultation' ? 'active' : ''}
                      onClick={() => {
                        handleFormToggle();
                        handleMenuClick('consultation')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="consultation"

                        >
                          <FontAwesomeIcon
                            icon={faFileMedical}
                            className="me-3"
                          />
                          <b>Consultation Form</b>
                        </span>
                      </li>
                    )}

                    <br />

                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'StockDetails' ? 'active' : ''}
                      onClick={() => {
                        handleStockDetailsToggle();
                        handleMenuClick('StockDetails')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="StockDetails"
                        >
                          <FontAwesomeIcon icon={faBoxes} className="me-3" />
                          <b>Stock Details</b>
                        </span>
                      </li>
                    )}
                    <br />
                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'purchase' ? 'active' : ''}
                      onClick={() => {
                        handlePurchaseToggle();
                        handleMenuClick('purchase')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="purchase"
                        >
                          <FontAwesomeIcon icon={faStore} className="me-3" />
                          <b>Purchase History</b>
                        </span>
                      </li>
                    )}
                    <br />

                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'billingHistory' ? 'active' : ''}
                      onClick={() => {
                        handleBillingHisToggle();
                        handleMenuClick('billingHistory')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                          data-menu="billingHistory"
                        >
                        <FontAwesomeIcon
                          icon={faMoneyBillTransfer}
                          className="me-3"
                        />
                        <b>Billing History</b>
                      </span>
                      </li>
                    )}
                    <br />
                    {user && user.user.user_role === "Doctor" && (
                      <li className={activeMenu === 'registration' ? 'active' : ''}
                      onClick={() => {
                        handleRegistrationFormToggle();
                        handleMenuClick('registration')
                      }}>
                        <span
                          className="text-decoration-none text-dark"
                         
                          data-menu="registration"

                        >
                          <FontAwesomeIcon icon={faIdCard} className="me-3" />
                          <b>Registration Form</b>
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
                <hr />
                <div>
                  {user && <UserProfile user={user} onLogout={handleLogout} />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-9 col-md-8 col-12">
          <div className="row">
            <div className="col">
              <div
                className="stock-details-content"
                style={{ display: showStockDetails ? "block" : "none" }}
              >
                {showStockDetails && (
                  <div className="stock-details-content">
                    <StockDetailsPage />
                  </div>
                )}
              </div>

              <div
                className="stock-details-content"
                style={{ display: showStockDetails1 ? "block" : "none" }}
              >
                {showStockDetails1 && (
                  <div className="stock-details-content">
                    <StockDetailsPage1 />
                  </div>
                )}
              </div>

              <div
                className="billing-content"
                style={{
                  display: showBilling ? "block" : "none",
                  marginLeft: "0px",
                }}
              >
                {showBilling && (
                  <div className="billing-content">
                    <Billing />
                  </div>
                )}
              </div>

              <div
                className="stock-details-content"
                style={{ display: showAddMedicine ? "block" : "none" }}
              >
                {showAddMedicine && (
                  <div className="stock-details-content">
                    <AddMedicine />
                  </div>
                )}
              </div>

              <div
                className="stock-details-content"
                style={{ display: showForm ? "block" : "none" }}
              >
                {showForm && (
                  <div className="stock-details-content">
                    <ConsultationForm />
                  </div>
                )}
              </div>

              <div
                className="stock-details-content"
                style={{ display: showPurchase ? "block" : "none" }}
              >
                {showPurchase && (
                  <div className="stock-details-content">
                    <Purchase />
                  </div>
                )}
              </div>

              <div
                className="stock-details-content"
                style={{ display: showBillingHis ? "block" : "none" }}
              >
                {showBillingHis && (
                  <div className="stock-details-content">
                    <BillingHis />
                  </div>
                )}
              </div>

              <div
                className="registration-form-content"
                style={{ display: showRegistrationForm ? "block" : "none" }}
              >
                {showRegistrationForm && (
                  <div className="registration-form-content">
                    <RegistrationForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;