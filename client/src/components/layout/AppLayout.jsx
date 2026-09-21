import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout({ title = 'Dashboard' }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="main-wrapper">
        <Navbar title={title} onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
