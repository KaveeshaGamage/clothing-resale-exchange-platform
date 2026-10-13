const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");

describe("authMiddleware.verifyToken", () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = "jest-auth-test-secret";
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }
  });

  it("rejects requests without a bearer token", () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authMiddleware.verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Access denied. No token provided."
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("sets the authenticated user for a valid JWT", () => {
    const token = jwt.sign({ id: 17, role: "customer" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authMiddleware.verifyToken(req, res, next);

    expect(req.user).toMatchObject({ id: 17, role: "customer" });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects expired JWTs with an explicit message", () => {
    const token = jwt.sign(
      { id: 17, role: "customer" },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    authMiddleware.verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Token expired. Please login again."
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("authMiddleware.checkRole", () => {
  it("permits an authenticated user with an allowed role", () => {
    const middleware = authMiddleware.checkRole("retail", "admin");
    const req = { user: { role: "retail" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("denies a user whose role is not allowed", () => {
    const middleware = authMiddleware.checkRole("retail");
    const req = { user: { role: "customer" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
