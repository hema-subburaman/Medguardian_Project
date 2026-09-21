import React from 'react';
import { FiSearch } from 'react-icons/fi';

export default function PatientFilters({
  search,
  onSearchChange,
  riskLevel,
  onRiskChange,
  gender,
  onGenderChange,
  onReset
}) {
  return (
    <div className="patient-filters-bar">
      <div className="search-input-wrapper">
        <FiSearch className="search-input-icon" />
        <input
          type="text"
          placeholder="Search by patient name, ID, condition, or room..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input search-input-field"
        />
      </div>

      <select
        value={riskLevel}
        onChange={(e) => onRiskChange(e.target.value)}
        className="form-select"
        style={{ width: 'auto', minWidth: 140 }}
      >
        <option value="">All Risk Levels</option>
        <option value="NORMAL">Normal</option>
        <option value="WARNING">Warning</option>
        <option value="HIGH">Critical / High</option>
      </select>

      <select
        value={gender}
        onChange={(e) => onGenderChange(e.target.value)}
        className="form-select"
        style={{ width: 'auto', minWidth: 120 }}
      >
        <option value="">All Genders</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>

      {(search || riskLevel || gender) && (
        <button
          onClick={onReset}
          className="btn btn-secondary btn-sm"
          style={{ padding: '8px 12px' }}
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
