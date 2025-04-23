import React from "react";
import styles from "./NavPane.module.css";

const NavPane = (mapPage = false) => {
  return (
    <div className={`${styles.navPane} ${mapPage ? styles.mapPage : ""}`}>
      <div className={styles.leftSection}>
        <img
          src="/logo.png" // Replace with your actual logo path
          alt="Logo"
          className={styles.logo}
        />
      </div>
      <div className={styles.rightSection}>
        <a href="#" className={styles.navLink}>
          Home
        </a>
        <a href="#" className={styles.navLink}>
          Map
        </a>
        <img
          src="/user-profile.jpg" // Replace with your actual user profile image path
          alt="User Profile"
          className={styles.profileImage}
        />
      </div>
    </div>
  );
};

export default NavPane;
