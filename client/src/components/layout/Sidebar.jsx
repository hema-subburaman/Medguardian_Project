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
  const { user, logout } = useAuth();
  const { unresolvedCount } = useSocket();

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: FiGrid },
    { to: '/patients', label: 'Patients', icon: FiUsers },
    { to: '/monitoring', label: 'Live Monitoring', icon: FiActivity },
    { to: '/emergency', label: 'Emergency Center', icon: FiAlertCircle, badge: unresolvedCount },
    { to: '/history', label: 'Patient History', icon: FiClock },
    { to: '/analytics', label: 'Analytics', icon: FiBarChart2 },
    { to: '/devices', label: 'IoT Devices', icon: FiCpu }
  ];

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
        <div className="nav-section-title">Clinical Workspace</div>
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
