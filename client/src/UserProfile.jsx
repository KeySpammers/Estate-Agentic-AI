import React from "react";
import "./UserProfile.css";
import Header from "./Header";
import profilePic from "./Images/user.png";
import ChatBot from "./ChatBot";
import {
  FaMapMarkerAlt,
  FaRulerCombined,
  FaDollarSign,
  FaHome,
  FaChartLine,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import p1 from "./Images/p1.jpg";
import p2 from "./Images/p2.jpg";
import p3 from "./Images/p3.jpg";
import p4 from "./Images/p4.jpg";
import p5 from "./Images/p5.jpg";
import p6 from "./Images/p6.jpg";

const UserProfile = () => {
  const propertyImages = [p1, p2, p3, p4, p5, p6];
  const user = {
    name: "John Doe",
    role: "Real Estate Investor",
    detail: "Member since January 2021",
    properties: 6,
    totalValue: "$5,450,000",
    avgROI: "6.4%",
  };

  const properties = [
    {
      name: "Palm Jumeirah Villa",
      location: "Dubai",
      area: "6,000 sqft",
      value: "$950,000",
      rent: "$60,000/year",
      roi: "6.8%",
    },
    {
      name: "Downtown Apartment",
      location: "Dubai",
      area: "1,200 sqft",
      value: "$600,000",
      rent: "$36,000/year",
      roi: "5.9%",
    },
    {
      name: "Business Bay Office",
      location: "Dubai",
      area: "2,500 sqft",
      value: "$450,000",
      rent: "$28,000/year",
      roi: "6.4%",
    },
    {
      name: "JVC Townhouse",
      location: "Jumeirah Village Circle",
      area: "3,000 sqft",
      value: "$700,000",
      rent: "$42,000/year",
      roi: "6.0%",
    },
    {
      name: "Dubai Marina Penthouse",
      location: "Dubai Marina",
      area: "2,200 sqft",
      value: "$1,200,000",
      rent: "$75,000/year",
      roi: "6.25%",
    },
    {
      name: "Al Barsha Family Home",
      location: "Al Barsha",
      area: "3,500 sqft",
      value: "$800,000",
      rent: "$48,000/year",
      roi: "6.0%",
    },
  ];

  const getRoiClass = (roiStr) => {
    const val = parseFloat(roiStr);
    if (val >= 6.5) return "roi-high";
    if (val >= 5.5) return "roi-medium";
    return "roi-low";
  };

  return (
    <div className="user-profile-page">
      <Header />
      <ChatBot />

      <div className="top-section">
        <div className="user-info">
          <img src={profilePic} alt="Profile" className="user-img" />
          <div className="user-text">
            <h2>{user.name}</h2>
            <p className="user-role">{user.role}</p>
            <p className="user-detail">{user.detail}</p>
          </div>
        </div>

        <div className="insights">
          <div className="insight-card">
            <h4>Properties Owned</h4>
            <p>{user.properties}</p>
          </div>
          <div className="insight-card">
            <h4>Total Portfolio Value</h4>
            <p>{user.totalValue}</p>
          </div>
          <div className="insight-card">
            <h4>Average ROI</h4>
            <p>{user.avgROI}</p>
          </div>
        </div>
      </div>

      <div className="properties-list">
        <div className="properties-header">
          <h3>My Properties</h3>
          <div className="properties-actions">
            <button className="add-button">
              <FaPlus className="action-icon" /> Add Property
            </button>
            <button className="edit-button">
              <FaEdit className="action-icon" /> Edit
            </button>
          </div>
        </div>

        <div className="property-cards">
          {properties.map((property, idx) => (
            <div key={idx} className="property-card">
              <img
                src={propertyImages[idx]}
                alt={property.name}
                className="property-img-horizontal"
              />

              <div className="property-details-horizontal">
                <h4>{property.name}</h4>
                <p>
                  <FaMapMarkerAlt className="icon" />
                  <strong>Location:</strong> {property.location}
                </p>
                <p>
                  <FaRulerCombined className="icon" />
                  <strong>Area:</strong> {property.area}
                </p>
                <p>
                  <FaDollarSign className="icon" />
                  <strong>Price:</strong> {property.value}
                </p>
                <p>
                  <FaHome className="icon" />
                  <strong>Rent:</strong> {property.rent}
                </p>
                <p className={getRoiClass(property.roi)}>
                  <FaChartLine className="icon" />
                  <strong>ROI:</strong> {property.roi}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
