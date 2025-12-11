import React from "react";

export default function AppFooter() {
  return (
    <footer className="app-footer" aria-label="Nimbus footer">
      <div className="footer-center">
        NIMBUS Cannabis © {new Date().getFullYear()}
      </div>
    </footer>
  );
}
