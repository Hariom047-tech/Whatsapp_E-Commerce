import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = header.slice(7);
    req.admin = jwt.verify(token, process.env.JWT_SECRET || "change-this-secret-in-production");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
