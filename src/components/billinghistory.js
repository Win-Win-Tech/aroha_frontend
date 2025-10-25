import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { DatePicker } from "antd";
import moment from "moment";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../styles/stock.css";
import billbg from "../logo/medical-background.svg";
import config from "../config";

const BillingHis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [medicineData, setMedicineData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isViewed, setisViewed] = useState(false);
  const [invoiceData, setInvoiceData] = useState("");
  const itemsPerPage = 13;
  const [loader, setLoader] = useState(false);
  const [datefilteredData, setDateFilteredData] = useState([]);

  const filteredData = medicineData.filter(
    (item) =>
      item.mobileno &&
      item.mobileno.toLowerCase().includes(searchQuery.trim().toLowerCase()) &&
      (!fromDate ||
        moment(item.createdate).isSameOrAfter(fromDate)) &&
      (!toDate ||
        moment(item.createdate).isSameOrBefore(toDate))
  )
  .sort((a, b) => {
    return moment(b.createdate) - moment(a.createdate);
  });
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const dataOnCurrentPage = filteredData.slice(startIndex, endIndex);

  const fetchbillingData = async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/billingdata`
      );
      const sortedData = response.data.sort((a, b) => b.invoice_number - a.invoice_number);

      setMedicineData(sortedData);
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchbillingData();
  }, []);

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    const totalPages = Math.ceil(medicineData.length / itemsPerPage);
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFromDateChange = (date, dateString) => {
    setFromDate(moment(dateString).startOf('day').toISOString());
    setCurrentPage(1);
  };

  const handleToDateChange = (date, dateString) => {
    setToDate(moment(dateString).endOf('day').toISOString());
    setCurrentPage(1);
  };

  const View = async (invoiceNumber) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/billingdata/${invoiceNumber}`
      );
      const invoiceData = response.data;
      setInvoiceData(invoiceData);
      setisViewed(true);
    } catch (error) {
      console.error("Error fetching or processing invoice data:", error);
    }
  };

  const downloadPDF = async () => {
    try {
      setLoader(true);

      const html2canvasOptions = {
        scale: 2,
        logging: false,
        allowTaint: true,
      };

      const capture = document.querySelectorAll(".bill");
      if (!capture || capture.length === 0) {
        throw new Error("Unable to find .bill elements");
      }

      const promises = Array.from(capture).map(async (element) => {
        let scale = 2;

        if (window.innerWidth < 768) {
          scale = 1;
        }

        const canvas = await html2canvas(element, {
          ...html2canvasOptions,
          scale,
        });
        return canvas.toDataURL("image/png");
      });

      const images = await Promise.all(promises);

      const jsPDFOptions = {
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      };

      const doc = new jsPDF(jsPDFOptions);
      const imageWidth = 210;
      const imageHeight = 297;

      images.forEach((imgData, index) => {
        if (index !== 0) {
          doc.addPage();
        }
        doc.addImage(imgData, "PNG", 0, 0, imageWidth, imageHeight);
      });

      const invoiceNumber = invoiceData[0].invoice_number;
      const fileName = `invoice_${invoiceNumber}.pdf`;

      doc.save(fileName);
      setLoader(false);
    } catch (error) {
      console.error("Error during PDF generation:", error);
      setLoader(false);
    }
  };

  const tstyle = {
    backgroundColor: "#000080",
    color: "white",
  };

  const handlecancel = (event) => {
    event.preventDefault();
    setisViewed(false);
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
    `}
  </style>
      <div>
        {!isViewed ? (
          <div
            style={{
              fontSize: "14px",
              fontFamily: "serif",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="container-fluid p-3"
              style={{ fontFamily: "serif" }}
            >
              <div className="row align-items-center">
                <div className="col-12 col-md-8">
                  <h2>
                    <b>Billing History</b>
                  </h2>
                </div>
              </div>

              <div className="row align-items-center mt-3">
                <div className="col-10 col-md-8 ">
                  <div
                    className="search-bar d-flex align-items-center"
                    style={{ marginLeft: "0px" }}
                  >
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                      type="text"
                      placeholder="Search Mobile number..."
                      value={searchQuery}
                      onChange={(event) =>
                        handleSearchChange(event.target.value)
                      }
                      style={{ height: "30px" }}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-12 mt-5 mt-md-0 d-flex justify-content-md-end">
                  <span className="bold-placeholder me-3">
                  From: <DatePicker onChange={handleFromDateChange}   />
                  </span>
                  <span className="bold-placeholder">
                    To: <DatePicker onChange={handleToDateChange}  />
                  </span>
                </div>
              </div>
            </div>

            <div className="billing-table ms-4">
              {dataOnCurrentPage.length === 0 ? (
                <p>No search results found</p>
              ) : (
                <div className="scrollable-body">
                  <table className="table">
                    <thead
                      className="sticky-top"
                      style={{
                        backgroundColor: "blue",
                      }}
                    >
                      <tr>
                        <th className="text-center">Created Date</th>
                        <th className="text-center">Invoice Number</th>
                        <th className="text-center">Patient Name</th>
                        <th className="text-center">Mobile Number</th>
                        <th className="text-center">Grand Total</th>
                        <th className="text-center">Bill</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataOnCurrentPage.map((item) => (
                        <tr key={item.id}>
                          <td className="text-center">
                            {item.createdate
                              ? moment(item.createdate).format("YYYY-MM-DD")
                              : "N/A" || "N/A"}
                          </td>
                          <td className="text-center">
                            {item.invoice_number || "N/A"}
                          </td>
                          <td className="text-center">
                            {item.patientname || "N/A"}
                          </td>
                          <td className="text-center">
                            {item.mobileno || "N/A"}
                          </td>
                          <td className="text-center">
                            {item.grandtotal || "N/A"}
                          </td>
                          <td
                            className="text-center"
                            style={{ padding: "5px" }}
                          >
                            <button
                              className="export"
                              onClick={() => View(item.invoice_number)}
                              style={{ padding: "4px" }}
                            >
                              {" "}
                              View{" "}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pagination">
              <button onClick={handlePrevious} disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                {" "}
                {currentPage} of {Math.ceil(filteredData.length / itemsPerPage)}
              </span>
              <button
                onClick={handleNext}
                disabled={
                  currentPage === Math.ceil(filteredData.length / itemsPerPage)
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 container">
            <div className="row">
              <div className="col-lg-8 col-md-10 col-sm-12 ">
                <div>
                  <div className="text-end">
                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={downloadPDF}
                      disabled={loader}
                    >
                      Download as PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-success me-2"
                      onClick={handlecancel}
                    >
                      Go to Previous Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="row m-5 overflow-auto">
              <div className="col-md-10 col-lg-8">
                {Array.isArray(invoiceData) &&
                  invoiceData.map((data, index) => {
                    const tablets = JSON.parse(data.tabletdetails).tablets;
                    const totalPages = Math.ceil(tablets.length / itemsPerPage);

                    return Array.from({ length: totalPages }, (_, page) => {
                      const startIndex = page * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;

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
                                    marginBottom: '20px'
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
                                <b>Patient Name:</b> {invoiceData[index].patientname}
                              </h5>
                            </div>

                            {/* Right Side - Invoice Details */}
                            <div style={{ textAlign: "right" }}>
                              <h3 style={{ color: "darkblue", marginBottom: "5px", fontSize: "20px", fontWeight: "bold" }}>
                                Invoice
                              </h3>
                              <div style={{ fontSize: "14px", color: "darkblue" }}>
                                <div style={{ marginBottom: "3px" }}>
                                  <b>Invoice No:</b> {invoiceData[index].invoice_number}
                                </div>
                                <div>
                                  <b>Invoice Date:</b> {invoiceData[index].createdate
                                    ? moment(invoiceData[index].createdate).format("YYYY-MM-DD")
                                    : "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>

                         

                          <div className="table-responsive mt-2 me-5 ms-5">
                            <table className="table table-bordered table-striped p-5">
                              <thead className="table-dark">
                                <tr>
                                  <th style={tstyle} className="text-center">
                                    S.No
                                  </th>
                                  <th style={tstyle} className="text-center">
                                    Medicine Name
                                  </th>
                                  <th style={tstyle} className="text-center">
                                    Price
                                  </th>
                                  <th style={tstyle} className="text-center">
                                    Qty
                                  </th>
                                  <th style={tstyle} className="text-center">
                                    Total
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {tablets
                                  .slice(startIndex, endIndex)
                                  .map((tablet, tabletIndex) => (
                                    <tr
                                      key={startIndex + tabletIndex}
                                      className="border-bottom"
                                    >
                                      <td className="text-center">
                                        {startIndex + tabletIndex + 1}
                                      </td>
                                      <td className="text-center">
                                        {tablet.medicinename}
                                      </td>
                                      <td className="text-center">
                                        {tablet.qtyprice}
                                      </td>
                                      <td className="text-center">
                                        {tablet.qty}
                                      </td>
                                      <td className="text-center">
                                        {tablet.total}
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
                                  <p>
                                    Cash Given: {invoiceData[index].cashgiven}
                                  </p>
                                  <p>Balance: {invoiceData[index].balance}</p>
                                </div>
                              </div>
                              <div>
                                <div className="text-end me-5">
                                  <p>Subtotal: {invoiceData[index].subtotal}</p>
                                  <p>
                                    Discount:{" "}
                                    <span>{invoiceData[index].discount}</span>
                                  </p>
                                  <p>
                                    Grand Total: {invoiceData[index].grandtotal}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    });
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BillingHis;