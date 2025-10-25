import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import billbg from "../logo/medical-background.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/stock.css";
import FloatingAlert from "./floatingalert";
import "../styles/billing.css";
import { useReactToPrint } from "react-to-print";
import config from "../config";
import Swal from 'sweetalert2';

function Billing() {
  const [medicineRows, setMedicineRows] = useState(
    Array.from({ length: 3 }, (_, index) => ({ id: index + 1 }))
  );
  const [subtotal, setSubtotal] = useState("");
  const [discount, setDiscountTotal] = useState("0.00");

  const [grandtotal, setGrandTotal] = useState("");
  const [submittedData, setSubmittedData] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRefs = useRef([]);
  const [loader, setLoader] = useState(false);
  const [cashGiven, setCashGiven] = useState("0");
  const [balance, setBalance] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [suggestions, setSuggestions] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [buttonText, setButtonText] = useState("Add More Medicine");
  const [patientName, setPatientName] = useState("");
  const [requestedQuantities, setRequestedQuantities] = useState({});
  const [availableQuantities, setAvailableQuantities] = useState({});
  const [isAlertActive, setAlertActive] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previoussQuantity, setPrevioussQuantity] = useState(false);

  const componentRef = useRef(null);
  const rowsPerPage = 13;
  const totalPages = Math.ceil(submittedData.length / rowsPerPage);

  useEffect(() => {
    handleTotal();
    setIsSubmitted(false);
    fetchSuggestions();
  }, [medicineRows, discount]);


  const fetchSuggestions = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/suggestions`);
      const fetchedSuggestions = response.data;
      setSuggestions(fetchedSuggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const showAlert = (message, type, duration = 3000) => {
    setAlert({ message, type });

    setTimeout(() => {
      setAlert({ message: "", type: "" });
    }, duration);
  };

  useEffect(() => {
    const handleResize = () => {
      setButtonText(
        window.innerWidth <= 767 ? "Add More" : "Add More Medicine"
      );
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setMedicineRows((prevRows) => {
      const newRows = prevRows.map((row) => ({
        ...row,
        refs: Array.from(
          { length: 4 },
          (_, i) => inputRefs.current[row.id]?.[i] || null
        ),
      }));
      return newRows;
    });
  }, []);

  useEffect(() => {
    if (cashGiven !== "" && grandtotal !== "") {
      const newCashGiven = parseFloat(cashGiven) || "";
      const newBalance = (newCashGiven - grandtotal).toFixed(2);
      setBalance(newBalance);
    }
  }, [cashGiven, grandtotal]);

  const afterSubmit = () => {
    setIsLoading(true);

    setTimeout(() => {
      showAlert("Form submitted successfully!", "success");
      setIsButtonDisabled(true);
      setIsLoading(false);
    }, 2000);
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-GB", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  let prevQtyDict = {};

  const handleQuantity = async (event, rowIndex, colIndex, id) => {
    const input = inputRefs.current[id]?.[1];
    const totalInput = inputRefs.current[id]?.[3];
    const qtyInput = inputRefs.current[id]?.[1];

    const qtyValue = input.value.trim();
    input.value = qtyValue.replace(/\D/g, "");
    const qty = Math.floor(parseFloat(qtyValue)) || 0;
    const qtyprice = parseFloat(inputRefs.current[id]?.[2].value) || 0;
    const total = qty * qtyprice;

    if (totalInput) {
      totalInput.value = total.toFixed(2);
    }

    const tabletname = inputRefs.current[id]?.[0].value || "";
    const { medicinename, dosage } = extractMedicineInfo(tabletname);


    setMedicineRows((prevRows) =>
      prevRows.map((row) => (row.id === id ? { ...row, total } : row))
    );
  };



  function handlePatientNameChange(event) {
    const newName = event.target.value;
    const regex = /^[a-zA-Z ]+$/;
    setPatientName(newName);
    if (!regex.test(newName)) {
      event.target.value = newName.slice(0, -1);
    }
  }

  const handleTotal = () => {
    if (isAlertActive) {
      return;
    }
    const newSubtotal = medicineRows
      .reduce((acc, row) => acc + (row.total || 0), 0)
      .toFixed(2);
    setSubtotal(newSubtotal);

    const newGrandTotal = (newSubtotal - discount).toFixed(2);

    setGrandTotal(newGrandTotal);
  };

  const extractMedicineInfo = (tabletname) => {
    const lastSpaceIndex = tabletname.lastIndexOf(" ");

    if (lastSpaceIndex !== -1) {
      const dosage = tabletname.substring(lastSpaceIndex + 1).trim();
      const medicinename = tabletname.substring(0, lastSpaceIndex);

      return { medicinename, dosage };
    } else {
      return { medicinename: "", dosage: "" };
    }
  };

  const handleSuggestionSelect = async (selectedSuggestion, id) => {

    try {
      const isSuggestionSelected = suggestions.some(
        suggestion => suggestion.medicine_info === selectedSuggestion
      );

      if (!isSuggestionSelected) {
        return;
      }

      const { medicinename, dosage } = extractMedicineInfo(selectedSuggestion);
      const mrpResponse = await axios.get(
        `${config.apiUrl}/getMRP?medicinename=${medicinename}&dosage=${dosage}`
      );
      const mrp = mrpResponse.data.mrp;

      if (mrp !== undefined) {
        const qtyPriceInput = inputRefs.current[id]?.[2];

        if (qtyPriceInput) {
          qtyPriceInput.value = mrp || "";

          const input = inputRefs.current[id]?.[1];
          const totalInput = inputRefs.current[id]?.[3];

          const qtyValue = input.value.trim();
          input.value = qtyValue.replace(/\D/g, "");
          const qty = Math.floor(parseFloat(qtyValue)) || 0;
          const qtyprice = parseFloat(inputRefs.current[id]?.[2].value) || 0;
          const total = qty * qtyprice;

          if (totalInput) {
            totalInput.value = total.toFixed(2);
          }

        }
      }
    } catch (error) {
      console.error("Error fetching MRP:", error);
    }
  };


  const handleKeyPress = async (event, rowIndex, colIndex, id) => {
    const medicineNameInput = inputRefs.current[id]?.[0];
    const qtyPriceInput = inputRefs.current[id]?.[2];
    const empty = medicineNameInput?.value || "";

    if (empty.trim() === "") {
      return;
    }

    if (event.target.tagName.toLowerCase() === "input") {
      event.preventDefault();
      if (colIndex === 0 || colIndex === 1 || colIndex === 2) {
        const tabletname = inputRefs.current[id]?.[0].value || "";
        const { medicinename, dosage } = extractMedicineInfo(tabletname);

        if (event.target.id === `medicinename${id}`) {
          try {
            const response = await axios.get(
              `${config.apiUrl}/allstock?medicinename=${medicinename}&dosage=${dosage}`
            );
            const expired = response.data.expired;

            if (expired) {
              const expiredDate = new Date(expired);
              const expiredDateString = expiredDate.toISOString().split("T")[0];
              showAlert(
                `${medicinename} ${dosage} expired on ${expiredDateString} !`
              );
              clearRow(id);
            }
          } catch (error) {
            if (event.target.id !== "") {
              showAlert(`"${tabletname}" Medicine not available.`);
              clearRow(id);
            }
          }
        }
      }
    }
  };


  const handleClear = (e, id) => {
    const removedMedicine = medicineRows.find((row) => row.id === id);
    const medicinename = removedMedicine.refs[0].value;

    const totalValue = removedMedicine.refs[3].value || 0;

    const updatedRows = medicineRows.map((row) => {
      if (row.id === id) {
        return {
          ...row,
          total: '',
          refs: row.refs.map((ref, index) => {
            if (index === 0 || index === 1 || index === 2) {
              ref.value = '';
            } else if (index === 3) {
              ref.value = '';
            }
            return ref;
          }),
        };
      }

      return row;
    });

    setMedicineRows(updatedRows);
  };


  const handleRemoveMedicine = (id) => {
    const removedMedicine = medicineRows.find((row) => row.id === id);

    if (removedMedicine && removedMedicine.refs && removedMedicine.refs[0]) {
      const medicinename = removedMedicine.refs[0].value;
      const qty = removedMedicine.refs[1].value;

      updateAvailableQuantities(medicinename, +qty);
      const updatedQuantities = { ...requestedQuantities };
      if (updatedQuantities[medicinename] !== undefined) {
        updatedQuantities[medicinename] -= qty;
      } else {
        updatedQuantities[medicinename] = -qty;
      }
      setRequestedQuantities(updatedQuantities);
    }

    setMedicineRows((prevRows) => {
      const updatedRows = prevRows.filter((row) => row.id !== id);
      inputRefs.current[id] = null;
      return updatedRows;
    });
  };

  const clearRow = (id) => {
    const medicineNameInput = inputRefs.current[id]?.[0];
    const qtyInput = inputRefs.current[id]?.[1];
    const qtyPriceInput = inputRefs.current[id]?.[2];
    const totalInput = inputRefs.current[id]?.[3];

    if (medicineNameInput) {
      medicineNameInput.value = "";
    }
    if (qtyInput) {
      qtyInput.value = "";
    }
    if (qtyPriceInput) {
      qtyPriceInput.value = "";
    }
    if (totalInput) {
      totalInput.value = "";
    }
  };

  const handleAddMedicine = () => {
    const newId = Date.now();
    inputRefs.current[newId] = Array.from({ length: 4 }, (_, i) => null);

    setMedicineRows((prevRows) => [
      ...prevRows,
      { id: newId, refs: inputRefs.current[newId] },
    ]);

    const nextInput = inputRefs.current[newId][0];
    if (nextInput) {
      nextInput.focus();
    }
  };

  const handleCashGivenChange = (event) => {
    const newCashGiven = event.target.value.replace(/[^\d]/g, "");
    setCashGiven(newCashGiven);
  };
  const handleCashGivenBlur = () => {
    const formattedValue = cashGiven.replace(/[^\d.]/g, "").replace(/^0+/, "");

    setCashGiven(formattedValue === "" ? "0" : formattedValue);
  };

  const handleDiscountBlur = () => {
    const discountValue = parseFloat(discount);
    if (isNaN(discountValue)) {
      setDiscountTotal("0.00");
    } else {
      const formattedValue = discountValue.toFixed(2);
      setDiscountTotal(formattedValue);
    }
  };

  const handleCountryCodeChange = (e) => {
    setCountryCode(e.target.value);
  };

  const handleMedicineInputChange = (event, id) => {

    const selectedValue = event.target.value.trim();
    const { medicinename } = extractMedicineInfo(selectedValue);
    
    handleSuggestionSelect(medicinename, id);
  }


  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    const formattedValue = inputValue.replace(/\D/g, "").slice(0, 10);
    setMobileNo(formattedValue);
  };

  const handleDiscountChange = (event) => {
    const inputValue = event.target.value;
  
    const sanitizedInput = inputValue.replace(/[^0-9.]/g, '');
  
    const regex = /^\d+(\.\d{0,2})?$/;
    if (regex.test(sanitizedInput) || sanitizedInput === '') {
      const newDiscountTotal = (sanitizedInput) || 0;
      setDiscountTotal(newDiscountTotal);
  
      const newGrandTotal = subtotal - newDiscountTotal;
      setGrandTotal(newGrandTotal);
    }
  };
  

  const updateAvailableQuantities = (medicinename, quantity) => {
    setAvailableQuantities((prevQuantities) => {
      const updatedQuantities = { ...prevQuantities };
      updatedQuantities[medicinename] =
        (prevQuantities[medicinename] || 0) + quantity;

      return updatedQuantities;
    });
  };

  const handleBackendError = (errorMessage) => {

    Swal.fire({
      title: 'Error!',
      html: errorMessage.replace(/\n/g, '<br>'),

      confirmButtonText: 'OK',
      customClass: {
        title: 'error-title',
        content: 'error-content',
      },
      showClass: {
        popup: 'animate__animated animate__fadeIn'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOut'
      }

    }).then(() => {
      const medicineNames = errorMessage.match(/\(([^)]+)\)/g);
      if (medicineNames) {
        medicineNames.forEach(medicineName => {
          const trimmedMedicineName = medicineName.replace(/[\(\)]/g, '');

          const matchingRows = medicineRows.filter(row => {
            return inputRefs.current[row.id][0].value === trimmedMedicineName;
          });

          matchingRows.forEach(matchingRow => {
            const inputField = inputRefs.current[matchingRow.id][0] && inputRefs.current[matchingRow.id][1];

            inputField.classList.add('highlight-error');

            inputField.addEventListener('input', () => {
              inputField.classList.remove('highlight-error');
            });
          });
        });
      }
    });
  };



  const handleSubmit = async () => {

    const isAnyFieldFilled = medicineRows.some((row) => {
      const hasFilledInput = inputRefs.current[row.id].some(
        (input) => !!input.value.trim()
      );
      return hasFilledInput;
    });

    if (isSubmitted) {
      showAlert("Form submitted successfully!", "success");
      return;
    }

    if (!isAnyFieldFilled) {
      showAlert("Please fill in at least one input field", "error");
      return;
    }

    let hasIncompleteRow = false;

    const updatedMedicineRows = medicineRows
      .map((row) => {
        const medicinename = inputRefs.current[row.id][0].value;
        const qty = parseFloat(inputRefs.current[row.id][1].value) || "";
        const qtyprice = parseFloat(inputRefs.current[row.id][2].value) || "";
        const total = parseFloat(inputRefs.current[row.id][3].value) || "";

        if (
          (medicinename || qty || qtyprice) &&
          !(medicinename && qty && qtyprice)
        ) {
          showAlert("Please fill in all fields", "error");
          hasIncompleteRow = true;

          return null;
        }
        inputRefs.current[row.id][3].value = total;

        return {
          id: row.id,
          medicinename: medicinename,
          qty: qty.toString(),
          qtyprice: qtyprice.toString(),
          total: total,
        };
      })
      .filter(
        (row) => row && row.medicinename && row.medicinename.trim() !== ""
      );

    if (hasIncompleteRow) {
      return;
    }

    function highlightInvalidField(fieldId, placeholderText) {
      const field = document.getElementById(fieldId);
      if (field) {
        field.classList.add("highlight-input");
        field.placeholder = placeholderText;
      }
    }

    const patientName = document.getElementById("patientname").value.trim();
    if (!patientName) {
      highlightInvalidField("patientname", "Fill the mandatory field");
      return;
    } else if (!/^[a-zA-Z\s]+$/.test(patientName)) {
      highlightInvalidField("patientname", "Fill the mandatory field");
      return;
    } else if (/\d/.test(patientName)) {
      highlightInvalidField("patientname", "Fill the mandatory field");
      return;
    } else {
      document
        .getElementById("patientname")
        .classList.remove("highlight-input");
    }

    const mobileno = document.getElementById("mobileno").value.trim();
    if (!mobileno || mobileno.length < 10) {
      highlightInvalidField("mobileno", "Fill the mandatory field");
      return;
    } else {
      document.getElementById("mobileno").classList.remove("highlight-input");
    }

    const cashgiven = document.getElementById("cashgiven").value.trim();
    if (!cashgiven) {
      highlightInvalidField("cashgiven", "Fill the mandatory field");
      return;
    } else {
      document.getElementById("cashgiven").classList.remove("highlight-input");
    }

    setSubmittedData(updatedMedicineRows);
    setIsButtonDisabled(true);


    const billingData = {
      medicineRows: updatedMedicineRows,
      subtotal: document.getElementById("subtotal").value || "",
      discount: discount,
      grandtotal: document.getElementById("grandtotal").value || "",
      patientname: document.getElementById("patientname").value || "",
      doctorname: document.getElementById("doctorname").value || "",
      mobileno: document.getElementById("mobileno").value || "",
      cashgiven: cashgiven,
      balance: balance,
      medicinename: updatedMedicineRows.map((row) => row.medicinename),
    };

    try {
      const response = await axios.post(
        `${config.apiUrl}/billing`,
        billingData
      );
      const generatedInvoiceNumber = response.data.invoicenumber;

      setIsSubmitted(true);

      setInvoiceNumber(generatedInvoiceNumber);
    } catch (error) {
      console.error("Error submitting billing data:", error);
      if (error.response && error.response.data && error.response.data.messages) {

        const errorMessage = error.response.data.messages.join("\n");
        handleBackendError(errorMessage);
        setIsButtonDisabled(false);

      } else {
        handleBackendError("Error", "An unexpected error occurred. Please try again later.", "error");
      }
    }

  };



  const handlePdf = async () => {
    setLoader(true);
    const html2canvasOptions = {
      scale: 2,
      logging: false,
      allowTaint: true,
    };

    const jsPDFOptions = {
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    };

    const doc = new jsPDF(jsPDFOptions);

    const pages = document.querySelectorAll(".bill");

    for (let i = 0; i < pages.length; i++) {
      const capture = pages[i];

      const canvas = await html2canvas(capture, html2canvasOptions);
      const imgData = canvas.toDataURL("image/png");

      const imageWidth = 180;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      const marginLeft = (doc.internal.pageSize.width - imageWidth) / 2;
      const marginTop = (doc.internal.pageSize.height - imageHeight) / 2;

      if (i > 0) {
        doc.addPage();
      }

      doc.addImage(
        imgData,
        "PNG",
        marginLeft,
        marginTop,
        imageWidth,
        imageHeight
      );
    }

    setLoader(false);
    doc.save("bill.pdf");
  };

  const handleWhatsApp = () => {
    const phoneNumber = `${countryCode}${mobileNo}`;
    let message = `Hello ${patientName}! Your bill details:\n`;

    message += `Grand Total: ${grandtotal}\n\nPurchased Tablets:\n`;

    message += "S.No | Medicine Name | Qty | Price | Total\n";
    message += "--------------------------------------------\n";

    submittedData.forEach((data, index) => {
      const { medicinename, qty, qtyprice, total } = data;
      message += `${index + 1
        } | ${medicinename} | ${qty} | ${qtyprice} | ${total}\n`;
    });

    message += `Subtotal: ${subtotal}\n`;
    message += `Discount: ${discount}\n`;

    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappLink, "_blank");
  };

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: "billing-data",
  });

  const handleCancel = () => {
    setSubtotal("");
    setGrandTotal("");
    setMobileNo("");
    setCashGiven("");
    setBalance("");
    setCountryCode("+91");
    setDiscountTotal("0.00");

    Object.values(inputRefs.current).forEach((refs) => {
      refs.forEach((ref) => {
        if (ref) {
          ref.value = "";
        }
      });
    });
    setIsSubmitted(false);
    setIsButtonDisabled(false);
    window.location.reload();
  };

  const tstyle = {
    backgroundColor: "#000080",
    color: "white",
  };

  return (
    <>
      <style>
        {`
      @media print  {
        body {
          margin: 10px;
        }  
      }

      input.error {
        border: 1px solid red;
      }

      .highlight-input {
        border: 1px solid red;
      }

      .highlight-error {
        border: 1px solid red;
      }

    `}
      </style>

      <div className="container" style={{ fontFamily: "serif" }}>
        {!isSubmitted ? (
          <div className="row">
            <div className="container">
              <div>
                <h2 className="text-start">
                  <b>Billing</b>
                </h2>
              </div>
              <div
                className="bg-white border  ps-4 pe-5 pb-4"
                style={{ maxWidth: "1000px", margin: "0" }}
              >
                <div className="table-responsive">
                  <table className="table custom-table-no-border ">
                    <thead>
                      <tr>
                        <th>
                          <h5>
                            <b className="ms-1">Medicine Name</b>
                          </h5>
                        </th>
                        <th>
                          <h5>
                            <b className="ms-1">Quantity</b>
                          </h5>
                        </th>
                        <th>
                          <h5>
                            <b className="ms-1">Price</b>
                          </h5>
                        </th>
                        <th>
                          <h5>
                            <b className="ms-1">Total</b>
                          </h5>
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicineRows.map(({ id, refs }, rowIndex) => (
                        <tr key={id}>
                          <td>
                            <input
                              id={`medicinename${id}`}
                              type="text"
                              className="form-control"
                              placeholder="Enter Name"
                              

                              ref={(el) =>
                                ((inputRefs.current[id] ||= [])[0] = el)
                              }
                              onBlur={(e) => handleKeyPress(e, rowIndex, 0, id)}
                              list="medicineSuggestions"
                              onChange={(e) => {  
                                const uppercaseValue = e.target.value.toUpperCase();  
                                e.target.value = uppercaseValue;
                                  handleSuggestionSelect(uppercaseValue, id);    
                                  handleMedicineInputChange(e, id);   
                                }}
                              onKeyDown={(e) => {
                                if (e.key === "Backspace" || e.key === "Delete") {
                                  // setPrevioussQuantity(true);
                                  handleClear(e, id);
                                }
                              }}

                            />
                            {suggestions.length > 0 && (
                              <datalist id="medicineSuggestions">
                                {suggestions.map((suggestion, index) => (
                                  <option
                                    key={index}
                                    value={`${suggestion.medicine_info}`}
                                  />
                                ))}
                              </datalist>
                            )}
                          </td>
                          <td>
                            <input
                              id={`qty${id}`}
                              type="number"
                              className="form-control"
                              placeholder="Enter Qty"
                              ref={(el) =>
                                ((inputRefs.current[id] ||= [])[1] = el)
                              }
                              onBlur={(e) => handleQuantity(e, rowIndex, 1, id)}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "-" ||
                                  e.key === "e" ||
                                  e.key === "."

                                ) {
                                  e.preventDefault();
                                }
                              }}
                              onInput={(e) => {
                                const value = e.target.value;
                                if (parseFloat(value) < 1) {
                                  e.target.value = '';
                                }
                              }}
                              style={{
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                              }}
                            />
                          </td>
                          <td>
                            <input
                              id={`qtyprice${id}`}
                              type="number"
                              className="form-control "
                              ref={(el) =>
                                ((inputRefs.current[id] ||= [])[2] = el)
                              }
                              readOnly
                              style={{
                                WebkitAppearance: "none",
                                MozAppearance: "textfield",
                              }}
                            />
                          </td>
                          <td>
                            <input
                              id={`total${id}`}
                              type="text"
                              className="form-control "
                              readOnly
                              ref={(el) =>
                                ((inputRefs.current[id] ||= [])[3] = el)
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn "
                              style={{
                                backgroundColor: "white",
                                border: "1px solid lightgray",
                              }}
                              onClick={() => handleRemoveMedicine(id)}
                            >
                              <FontAwesomeIcon
                                icon={faTimesCircle}
                                style={{ color: "black" }}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <FloatingAlert message={alert.message} type={alert.type} />
                <div>
                  <div className="row mt-0">
                    <div className="col-12 col-md-6">
                      <button
                        type="button"
                        className="btn ms-md-3 btn-sm"
                        style={{
                          backgroundColor: "teal",
                          color: "white",
                          WebkitAppearance: "none",
                          MozAppearance: "textfield",
                        }}
                        onClick={handleAddMedicine}
                      >
                        {buttonText}
                      </button>
                    </div>
                    <div className=" col-lg-5 col-md-12 d-flex flex-column align-items-end">
                      <div className="mt-0">
                        <b>
                          <label className="me-4 ">Sub Total</label>
                        </b>
                        <input
                          id="subtotal"
                          type="number"
                          className="border-0 text-start"
                          style={{
                            width: "70px",
                            background: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "textfield",
                          }}
                          value={subtotal}
                          readOnly
                        />
                      </div>

                      <div className="mt-1">
                        <b>
                          <label className="me-4">Discount</label>
                        </b>
                        <input
                          id="discount"
                          className="border-0 text-start p-1"
                          type="text"
                          value={discount}
                          onChange={handleDiscountChange}
                          onBlur={handleDiscountBlur}
                          style={{
                            width: "75px",
                            background: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "textfield",
                          }}
                        />
                      </div>

                      <div className="mt-1">
                        <div
                          className="p-1 d-inline-block text-start"
                          style={{ backgroundColor: "teal", height: "30px" }}
                        >
                          <b>
                            <label className="me-2 text-white">
                              Grand Total
                            </label>
                          </b>
                          <input
                            className="border-0 text-white text-start p-1"
                            style={{
                              backgroundColor: "teal",
                              width: "70px",
                              height: "20px",
                              WebkitAppearance: "none",
                              MozAppearance: "textfield",
                            }}
                            id="grandtotal"
                            type="number"
                            value={grandtotal}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-3 ms-2 ">
                    <div className=" col-lg-3 col-md-4 col-sm-3  me-5">
                      <b>
                        <label>Patient Name</label>
                      </b>
                      <div>
                        <input
                          type="text"
                          id="patientname"
                          onBlur={(e) => handleKeyPress(e, 0, 0, "patientname")}
                          onChange={handlePatientNameChange}
                          className="form-control"
                        />
                      </div>
                      <br />
                    </div>

                    <div className="col-lg-3 col-md-5 col-sm-3 me-4">
                      <b>
                        <label>Doctor Name</label>
                      </b>
                      <div>
                        <input
                          type="text"
                          id="doctorname"
                          value="Dr.Jeya Bharathi"
                          className="form-control"
                          onBlur={(e) => handleKeyPress(e, 0, 0, "doctorname")}
                        />
                      </div>
                      <br />
                    </div>

                    <div className="col-lg-3 col-md-4 col-sm-3 ">
                      <div className="row">
                        <b>
                          <label htmlFor="mobileno">
                            <b>Mobile No</b>
                          </label>
                        </b>
                      </div>
                      <div className="row">
                        <div className="d-flex">
                          <select
                            id="countryCode"
                            value={countryCode}
                            onChange={handleCountryCodeChange}
                            className="me-1 form-select"
                            style={{ width: "75px" }}
                          >
                            <option value="+91">+91 (India)</option>
                            <option value="+1">+1 (US)</option>
                            <option value="+44">+44 (UK)</option>
                          </select>
                          <input
                            type="tel"
                            id="mobileno"
                            value={mobileNo}
                            onChange={handleInputChange}
                            className="form-control"
                            style={{ width: "140px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <br />
                  <div className="row  ms-2">
                    <div className="col-lg-3 col-md-4 me-5">
                      <b>
                        <label>Invoice Date</label>
                      </b>{" "}
                      <input
                        type="text"
                        className="form-control"
                        defaultValue={currentDateFormatted}
                        readOnly
                      />
                      <br />
                    </div>
                    <div className="col-lg-3 col-md-4 me-4">
                      <b>
                        <label>Cash Given</label>
                      </b>
                      <input
                        type="text"
                        id="cashgiven"
                        value={cashGiven}
                        onChange={handleCashGivenChange}
                        onBlur={handleCashGivenBlur}
                        className="form-control"
                      />
                    </div>
                    <div className="col-lg-3 col-md-10 me-5">
                      <b>
                        <label>Balance</label>
                      </b>
                      <div>
                        <input
                          type="text"
                          id="balance"
                          value={balance}
                          readOnly
                          className="form-control"
                        />
                        <br />
                      </div>
                    </div>
                  </div>

                  <div className="row mt-2">
                    <div className="col-md-12 text-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-2"
                        onClick={handleCancel}
                        style={{ backgroundColor: "teal", color: "white" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn "
                        style={{ backgroundColor: "teal", color: "white" }}
                        onClick={handleSubmit}
                        disabled={isButtonDisabled} // Disable the button based on the state

                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-12 text-center mt-4">
                <button
                  type="button"
                  className="btn me-2"
                  onClick={handleWhatsApp}
                  style={{
                    backgroundColor: "teal",
                    color: "white",
                  }}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  className="btn  me-2"
                  onClick={handlePdf}
                  disabled={loader === true}
                  style={{
                    backgroundColor: "teal",
                    color: "white",
                  }}
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  className="btn me-2"
                  onClick={handlePrint}
                  style={{
                    backgroundColor: "teal",
                    color: "white",
                  }}
                >
                  Print
                </button>
                <button
                  type="button"
                  className="btn "
                  onClick={handleCancel}
                  style={{
                    backgroundColor: "teal",
                    color: "white",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="row m-4 overflow-auto">
              <div className="col-md-10 col-lg-8">
                <div ref={componentRef}>
                  {Array.from({ length: totalPages }, (_, page) => {
                    const startIndex = page * rowsPerPage;
                    const endIndex = startIndex + rowsPerPage;
                    const isLastPage = page === totalPages - 1;

                    return (
                        <div
                          key={page}
                          className="bill"
                                  style={{
                                    border: "1px solid grey",
                                    backgroundImage: `url(${billbg})`,
                                    backgroundSize: "cover",
                                    backgroundRepeat: "repeat",
                                    backgroundPosition: "0 0",
                                    height: "290mm",
                                    width: "205mm",
                                    position: "relative",
                                    marginBottom: "20px"
                                  }}
                        >
                        {/* Clinic Header - Centered like Consultation Page */}
                        <div style={{ 
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          marginTop: "20px",
                          marginBottom: "20px"
                        }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <img
                              src={require("../logo/medical-logo.svg").default}
                              alt="Clinic Logo"
                              style={{
                                width: "80px",
                                height: "80px",
                                marginRight: "20px"
                              }}
                            />
                            <div>
                              <h2 className="clinic-logo-main" style={{ marginBottom: "8px", fontSize: "24px", fontWeight: "900" }}>
                                AROHA
                              </h2>
                              <h4 className="clinic-logo-sub" style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "700" }}>
                                SKIN HAIR & WELLNESS CLINIC
                              </h4>
                              <p style={{ color: "#6c757d", margin: "0 0 4px 0", fontSize: "12px", fontWeight: "600" }}>
                                584, 1st floor, Karumbalai main road, Kk nagar, Madurai - 625020
                              </p>
                              <p style={{ color: "#6c757d", margin: "0", fontSize: "12px", fontWeight: "600" }}>
                                Contact: 8870321445, 7695959776
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Patient Name and Invoice Details Row */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "0 20px",
                          marginBottom: "20px"
                        }}>
                          {/* Left Side - Patient Name */}
                          <div>
                            <h5 style={{ color: "darkblue", marginBottom: "10px" }}>
                              <b>Patient Name:</b> {patientName}
                            </h5>
                          </div>

                          {/* Right Side - Invoice Details */}
                          <div style={{ textAlign: "right" }}>
                            <h3 style={{ color: "darkblue", marginBottom: "5px", fontSize: "20px", fontWeight: "bold" }}>
                              Invoice
                            </h3>
                            <div style={{ fontSize: "14px", color: "darkblue" }}>
                              <div style={{ marginBottom: "3px" }}>
                                <b>Invoice No:</b> {invoiceNumber}
                              </div>
                              <div>
                                <b>Invoice Date:</b> {currentDateFormatted}
                              </div>
                            </div>
                          </div>
                        </div>



                        <div className="table-responsive mt-1 me-5 ms-5">
                          <table className="table table-bordered table-striped p-5">
                            <thead className="table">
                              <tr>
                                <th className="text-center" style={tstyle}>
                                  S.No
                                </th>
                                <th className="text-center" style={tstyle}>
                                  Medicine Name
                                </th>
                                <th className="text-center" style={tstyle}>
                                  Price
                                </th>
                                <th className="text-center" style={tstyle}>
                                  Qty
                                </th>
                                <th className="text-center" style={tstyle}>
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(submittedData) &&
                                submittedData
                                  .slice(startIndex, endIndex)
                                  .map((data, index) => (
                                    <tr key={data.id}>
                                      <td className="text-center">
                                        {startIndex + index + 1}
                                      </td>
                                      <td className="text-center">
                                        {data.medicinename}
                                      </td>
                                      <td className="text-center">
                                        {data.qtyprice}
                                      </td>
                                      <td className="text-center">
                                        {data.qty}
                                      </td>
                                      <td className="text-center">
                                        {data.total}
                                      </td>
                                    </tr>
                                  ))}
                            </tbody>
                          </table>
                        </div>

                        {isLastPage && (
                          <div
                            className="d-flex justify-content-between"
                            style={{
                              position: "absolute",
                              bottom: "15%",
                              width: "100%",
                            }}
                          >
                            <div>
                              <div className="text-start ms-5">
                                <p>Cash Given: {cashGiven}</p>
                                <p>Balance: {balance}</p>
                              </div>
                            </div>
                            <div>
                              <div className="text-end me-5">
                                <p>Subtotal: {subtotal}</p>
                                <p>
                                  Discount: <span>{discount}</span>
                                </p>
                                <p>Grand Total: {grandtotal}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Billing;