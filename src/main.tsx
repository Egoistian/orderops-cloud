import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CaseStudyPage } from "./CaseStudyPage";
import "./styles.css";
import "./case-study.css";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
const screen = pathname === "/case-study" ? <CaseStudyPage /> : <App />;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {screen}
  </React.StrictMode>,
);
