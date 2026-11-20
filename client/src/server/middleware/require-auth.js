const User = require('../models/User');

function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Sign in to access this resource.' });
  }

  User.findById(req.session.userId)
    .select('_id email')
    .then((user) => {
      if (!user) {
        return req.session.destroy((error) => {
          if (error) return next(error);
          res.status(401).json({ error: 'Your session has expired. Sign in again.' });
        });
      }

      req.user = user;
      next();
    })
    .catch(next);
}

module.exports = requireAuth;
