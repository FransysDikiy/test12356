import React from "react";
import "../styles/HomePage.css";
import Layout from "../layouts/Layout";
import ReminderLogsDashboard from "./Dashboard";

const HomePage: React.FC = () => {
  return (
    <Layout>
      <ReminderLogsDashboard></ReminderLogsDashboard>
    </Layout>
  );
};

export default HomePage;
