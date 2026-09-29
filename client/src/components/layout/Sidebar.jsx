import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiUsers,
  FiActivity,
  FiAlertCircle,
  FiClock,
  FiBarChart2,
  FiCpu,
  FiLogOut,
  FiHeart
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isAdmin, isDoctor, isNurse } = useAuth();
  const { unresolvedCount } = useSocket();

  // Strict role-specific navigation items
  let navLinks = [];

  if (isAdmin) {
    navLinks = [
      { to: '/', label: 'System Dashboard', icon: FiGrid },
      { to: '/patients', label: 'Patient Directory', icon: FiUsers },
      { to: '/devices', label: 'IoT Fleet & Gateways', icon: FiCpu },
      { to: '/emergency', label: 'Emergency Audit', icon: FiAlertCircle, badge: unresolvedCount }
    ];
  } else if (isDoctor) {
    navLinks = [
      { to: '/', label: 'Hospital Dashboard', icon: FiGrid },
      { to: '/patients', label: 'Clinical Patients', icon: FiUsers },
      { to: '/monitoring', label: 'Live Monitoring', icon: FiActivity },
      { to: '/emergency', label: 'Emergency Center', icon: FiAlertCircle, badge: unresolvedCount },
      { to: '/history', label: 'Patient History', icon: FiClock },
      { to: '/analytics', label: 'Ward Analytics', icon: FiBarChart2 }
    ];
  } else if (isNurse) {
    navLinks = [
      { to: '/', label: 'Ward Dashboard', icon: FiGrid },
      { to: '/patients', label: 'Assigned Patients', icon: FiUsers },
      { to: '/monitoring', label: 'Bedside Monitoring', icon: FiActivity },
      { to: '/emergency', label: 'Emergency Triage', icon: FiAlertCircle, badge: unresolvedCount },
      { to: '/history', label: 'Patient History', icon: FiClock }
    ];
  } else {
    navLinks = [
      { to: '/', label: 'Dashboard', icon: FiGrid }
    ];
  }

  const workspaceTitle = isAdmin
    ? 'System Admin Workspace'
    : isDoctor
    ? 'Physician Workspace'
    : 'Nursing Care Workspace';

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <FiHeart />
        </div>
        <div>
          <div className="sidebar-brand-text">MedGuardian</div>
          <div className="sidebar-brand-tag">MERN · IoT Healthcare</div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">{workspaceTitle}</div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.to === '/'}
            >
              <Icon className="nav-item-icon" />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-item-badge">{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-avatar-mini">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>
        <div className="user-info-mini">
          <div className="user-name-mini">{user?.name || 'Healthcare Staff'}</div>
          <div className="user-role-mini">{user?.role || 'Staff'} · {user?.department || 'Ward'}</div>
        </div>
        <button
          className="logout-btn-mini"
          onClick={logout}
          title="Sign out of MedGuardian"
        >
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}
