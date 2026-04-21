const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

function createAuthToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.Role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function getUserPayload(user) {
  const customer = user.CustomerID && typeof user.CustomerID === 'object'
    ? {
        _id: user.CustomerID._id,
        Name: user.CustomerID.Name,
        Surname: user.CustomerID.Surname,
        Email: user.CustomerID.Email,
        PhoneNumber: user.CustomerID.PhoneNumber
      }
    : null;

  return {
    _id: user._id,
    Username: user.Username || '',
    Email: user.Email,
    Role: user.Role,
    CustomerID: customer?._id || null,
    Customer: customer
  };
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7).trim();
}

async function resolveAuthenticatedUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.sub).populate('CustomerID');

  if (!user || !user.IsActive) {
    return null;
  }

  req.user = user;
  req.auth = getUserPayload(user);
  req.token = token;
  return user;
}

async function optionalAuth(req, res, next) {
  try {
    await resolveAuthenticatedUser(req);
    next();
  } catch (error) {
    req.user = null;
    req.auth = null;
    next();
  }
}

async function requireAuth(req, res, next) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        await resolveAuthenticatedUser(req);
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!roles.includes(req.user.Role)) {
        return res.status(403).json({ error: 'You do not have permission to perform this action' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

function isOwnerOrAdmin(customerId, req) {
  if (!req.user) {
    return false;
  }

  if (req.user.Role === 'ADMIN') {
    return true;
  }

  return req.user.CustomerID && req.user.CustomerID._id.toString() === customerId.toString();
}

module.exports = {
  createAuthToken,
  getUserPayload,
  optionalAuth,
  requireAuth,
  requireRole,
  requireAdmin: requireRole('ADMIN'),
  requireCustomer: requireRole('CUSTOMER'),
  isOwnerOrAdmin
};
