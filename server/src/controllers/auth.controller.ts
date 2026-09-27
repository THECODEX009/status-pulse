import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { Subscription } from '../models/Subscription.js';
import { config } from '../config/env.js';
import { AuthPayload } from '../middleware/auth.js';

const generateTokens = (payload: AuthPayload) => {
  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpiration as any,
  });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiration as any,
  });
  return { accessToken, refreshToken };
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, organizationName, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: 'User with this email already exists' });
    return;
  }

  // Create Organization
  const slug = organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

  const org = await Organization.create({
    name: organizationName,
    slug,
  });

  // Create Free Tier Subscription
  await Subscription.create({
    organizationId: org._id,
    plan: 'FREE',
    status: 'active',
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'Admin', // First user in org defaults to Admin
    organizationId: org._id,
  });

  const payload: AuthPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: org._id.toString(),
  };

  const { accessToken, refreshToken } = generateTokens(payload);
  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: org._id,
      organizationName: org.name,
      organizationSlug: org.slug,
    },
    token: accessToken,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate('organizationId');
  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  const org: any = user.organizationId;
  const payload: AuthPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    organizationId: org._id.toString(),
  };

  const { accessToken, refreshToken } = generateTokens(payload);
  user.refreshToken = refreshToken;
  await user.save();

  setAuthCookies(res, accessToken, refreshToken);

  res.json({
    message: 'Login successful',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: org._id,
      organizationName: org.name,
      organizationSlug: org.slug,
    },
    token: accessToken,
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;

  if (!token) {
    res.status(401).json({ message: 'Refresh token missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtRefreshSecret) as AuthPayload;
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const payload: AuthPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organizationId.toString(),
    };

    const newTokens = generateTokens(payload);
    user.refreshToken = newTokens.refreshToken;
    await user.save();

    setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

    res.json({ token: newTokens.accessToken });
  } catch (err) {
    res.status(401).json({ message: 'Refresh token expired or invalid' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.userId, { refreshToken: null });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const user = await User.findById(req.user.userId).populate('organizationId');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const org: any = user.organizationId;
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: org._id,
      organizationName: org.name,
      organizationSlug: org.slug,
    },
  });
};
