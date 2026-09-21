import Patient from '../models/Patient.js';
import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments({ status: 'admitted' });
    const doctors = await User.countDocuments({ role: 'DOCTOR', active: true });
    const nurses = await User.countDocuments({ role: 'NURSE', active: true });
    const critical = await Patient.countDocuments({ status: 'admitted', riskLevel: 'HIGH' });
    const warning = await Patient.countDocuments({ status: 'admitted', riskLevel: 'WARNING' });
    const normal = await Patient.countDocuments({ status: 'admitted', riskLevel: 'NORMAL' });
    const activeEmergencies = await Emergency.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        totalPatients,
        doctors,
        nurses,
        critical,
        warning,
        normal,
        activeEmergencies
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getStatusDistribution = async (req, res, next) => {
  try {
    const counts = await Patient.aggregate([
      { $match: { status: 'admitted' } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    const result = [
      { name: 'Normal', value: 0, color: '#12B76A' },
      { name: 'Warning', value: 0, color: '#F79009' },
      { name: 'Critical', value: 0, color: '#F04438' }
    ];

    counts.forEach(c => {
      if (c._id === 'NORMAL') result[0].value = c.count;
      if (c._id === 'WARNING') result[1].value = c.count;
      if (c._id === 'HIGH') result[2].value = c.count;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getDiseaseDistribution = async (req, res, next) => {
  try {
    const diseases = await Patient.aggregate([
      { $match: { status: 'admitted' } },
      { $group: { _id: '$disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const formatted = diseases.map(d => ({
      disease: d._id || 'Unspecified',
      patients: d.count
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const getDailyEmergencies = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const emergencies = await Emergency.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          emergencies: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build complete 7-day array
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const found = emergencies.find(e => e._id === dayStr);
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        emergencies: found ? found.emergencies : 0
      });
    }

    res.json({ success: true, data: days });
  } catch (error) {
    next(error);
  }
};

export const getRecentActivity = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

    const formatted = logs.map(l => ({
      id: l._id,
      title: l.action.replace('_', ' '),
      description: l.details ? JSON.stringify(l.details).replace(/[{"}]/g, ' ') : '',
      performer: l.performerName,
      time: l.createdAt
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};
