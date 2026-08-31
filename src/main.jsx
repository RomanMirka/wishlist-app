import React from "react";
import ReactDOM from "react-dom/client";
import Wishlist from "./pages/Wishlist.jsx";
import Schedule from "./pages/Schedule.jsx";
import UpdateNotice from "./components/Updatenotice.jsx";
import "./index.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <UpdateNotice />
      <Routes>
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/schedule" element={<Schedule />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
