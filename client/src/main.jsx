import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import HomePage from "./components/HomePage";
import RosterPage from "./components/RosterPage";
import StatsPageWrapper from "./components/StatsPageWrapper";
import LeaderboardPage from "./components/LeaderboardPage";
import AdminPage from "./components/AdminPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily" element={<App mode="daily" />} />
          <Route path="/practice" element={<App mode="practice" />} />
          <Route path="/stats" element={<StatsPageWrapper />} />
          <Route path="/leaderboard/:type" element={<LeaderboardPage />} />
          <Route path="/roster" element={<RosterPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);
