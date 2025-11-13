const adminMiddleware = (req, res, next) => {
  if (req.user?.roles?.includes('admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

module.exports = adminMiddleware;
