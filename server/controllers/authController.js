import jwt from 'jsonwebtoken';
import User from '../models/User.js';

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
