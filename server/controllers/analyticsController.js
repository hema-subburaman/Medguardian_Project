import Patient from '../models/Patient.js';
import Emergency from '../models/Emergency.js';
import Device from '../models/Device.js';

export const getWardAnalytics = async (req, res, next) => {
  try {
    const totalPatients = await Patient.countDocuments({ status: 'admitted' });
    const devicesOnline = await Device.countDocuments({ status: 'ONLINE' });
    const totalDevices = await Device.countDocuments();
    const totalEmergencies = await Emergency.countDocuments();
    const resolvedEmergencies = await Emergency.countDocuments({ status: 'resolved' });

    // Incident types
    const types = await Emergency.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const emergencyDistribution = types.map(t => ({
      name: t._id.replace('_', ' '),
      value: t.count
    }));

    // Risk distribution
    const riskCounts = await Patient.aggregate([
      { $match: { status: 'admitted' } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    const riskDistribution = [
      { name: 'Normal', count: 0 },
      { name: 'Warning', count: 0 },
      { name: 'Critical', count: 0 }
    ];

    riskCounts.forEach(r => {
      if (r._id === 'NORMAL') riskDistribution[0].count = r.count;
      if (r._id === 'WARNING') riskDistribution[1].count = r.count;
      if (r._id === 'HIGH') riskDistribution[2].count = r.count;
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        totalDevices,
        devicesOnline,
        totalEmergencies,
        resolutionRate: totalEmergencies ? Math.round((resolvedEmergencies / totalEmergencies) * 100) : 100,
        emergencyDistribution,
        riskDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
