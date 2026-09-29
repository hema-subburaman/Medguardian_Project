import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'medguardian_super_secret_jwt_key_2026_clinical', {
    expiresIn: '30d'
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, department, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Healthcare staff email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'NURSE',
      department: department || 'General Ward',
      phone: phone || ''
    });

    if (req.user) {
      await AuditLog.create({
        action: 'USER_CREATED',
        performedBy: req.user._id,
        performerName: req.user.name,
        targetType: 'USER',
        targetId: user._id.toString(),
        details: { email: user.email, role: user.role }
      });
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid healthcare staff credentials' });
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Your healthcare staff account has been deactivated' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getAllStaff = async (req, res, next) => {
  try {
    const staff = await User.find({ active: true }).select('name email role department');
    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

// Admin User Management: List all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// Admin User Management: Activate/Deactivate user
export const updateUserStatus = async (req, res, next) => {
  try {
    const { active } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: Boolean(active) },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await AuditLog.create({
      action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      performedBy: req.user._id,
      performerName: req.user.name,
      targetType: 'USER',
      targetId: user._id.toString(),
      details: { email: user.email, active: user.active }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Admin User Management: Assign/Change user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'DOCTOR', 'NURSE'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await AuditLog.create({
      action: 'USER_ROLE_ASSIGNED',
      performedBy: req.user._id,
      performerName: req.user.name,
      targetType: 'USER',
      targetId: user._id.toString(),
      details: { email: user.email, newRole: role }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
