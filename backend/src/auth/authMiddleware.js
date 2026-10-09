const { getPublicUserById } = require("../data/database");

function requireAuthenticatedUser(request, response, next) {
  const userId = request.session?.userId;
  if (!Number.isSafeInteger(userId)) {
    return response.status(401).json({
      success: false,
      error: "Authentication required"
    });
  }

  const user = getPublicUserById(userId);
  if (!user) {
    return request.session.destroy((error) => {
      if (error) {
        return next(error);
      }
      return response.status(401).json({
        success: false,
        error: "Authentication required"
      });
    });
  }

  request.user = user;
  return next();
}

module.exports = { requireAuthenticatedUser };
