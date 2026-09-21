import React from 'react';
import { FiCheckCircle, FiCpu } from 'react-icons/fi';

export default function ExplainableAICard({ aiRisk, subtitle = 'Explainable Rule-Based Clinical Intelligence' }) {
  if (!aiRisk) return null;

  const {
    riskLevel = 'NORMAL',
    riskScore = 15,
    riskColor = '#12B76A',
    statusIcon = '✅',
    reasons = [],
    recommendation = 'Continue routine clinical observation.'
  } = aiRisk;

  return (
    <div className="explainable-ai-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCpu style={{ color: 'var(--primary-blue)', fontSize: '1.2rem' }} />
          <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.98rem' }}>Clinical AI Assessment</h4>
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {subtitle}
        </span>
      </div>

      <div className="ai-score-row">
        <div className="ai-score-circle" style={{ borderColor: riskColor, backgroundColor: `${riskColor}10` }}>
          <span style={{ fontSize: '1.4rem' }}>{statusIcon}</span>
          <span className="ai-score-number" style={{ color: riskColor }}>{riskScore}</span>
          <span className="ai-score-max">/ 100</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: riskColor }}>
              {riskLevel} RISK
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time rule-based telemetry evaluation against physiological safety parameters.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>
          Clinical Reasons & Triggers
        </p>
        <ul className="ai-reasons-list">
          {reasons.length === 0 ? (
            <li className="ai-reason-item">All physiological metrics within baseline reference values.</li>
          ) : (
            reasons.map((r, i) => (
              <li key={i} className="ai-reason-item">
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: riskColor, marginTop: 7, flexShrink: 0 }} />
                <span>{r}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="ai-recommendation-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiCheckCircle style={{ color: 'var(--primary-dark)' }} />
          <div className="ai-recommendation-title">Staff Action Directive</div>
        </div>
        <div className="ai-recommendation-text">{recommendation}</div>
      </div>
    </div>
  );
}
