jest.mock("../config/db", () => ({
  query: jest.fn(),
  promise: jest.fn()
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password")
}));

const db = require("../config/db");
const bcrypt = require("bcrypt");
const adminController = require("./adminController");

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe("adminController.createUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("adminController.getUsers", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("includes each retail partner's count of verified listings", () => {
      const users = [
        { id: 12, role: "retail", fullName: "Rewear Co.", verifiedListings: 4 }
      ];
      db.query.mockImplementation((sql, callback) => {
        expect(sql).toContain("p.retail_partner_id = u.id");
        expect(sql).toContain("p.verification_status = 'verified'");
        callback(null, users);
      });
      const res = createResponse();

      adminController.getUsers({}, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, users });
    });
  });

  describe("adminController.assignListingToRetail", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("saves the retail assignment and resets verification to pending", async () => {
      const query = jest.fn()
        .mockResolvedValueOnce([[{ id: 3 }]])
        .mockResolvedValueOnce([{ affectedRows: 1 }]);
      db.promise.mockReturnValue({ query });
      const req = { params: { id: "13" }, body: { retail_id: "3" } };
      const res = createResponse();

      await adminController.assignListingToRetail(req, res);

      expect(query).toHaveBeenLastCalledWith(
        expect.stringContaining("SET retail_partner_id = ?, verification_status = 'pending'"),
        [3, 13]
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Listing assigned to retail partner for verification"
      });
    });
  });

  it("rejects a role that is not supported", async () => {
    const req = { body: { role: "owner" } };
    const res = createResponse();

    await adminController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Select a valid user role" });
    expect(db.promise).not.toHaveBeenCalled();
  });

  it("creates a retail account using a password hash and returns safe user data", async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 23 }]);
    db.promise.mockReturnValue({ query });
    const req = {
      body: {
        role: "retail",
        companyName: "  Rewear Co. ",
        businessRegistrationId: " REG-23 ",
        companyAddress: "  Main Street ",
        email: " SALES@REWEAR.TEST ",
        phone: "5550123",
        password: "secret1"
      }
    };
    const res = createResponse();

    await adminController.createUser(req, res);

    expect(bcrypt.hash).toHaveBeenCalledWith("secret1", 10);
    expect(query).toHaveBeenLastCalledWith(
      expect.stringContaining("INSERT INTO users"),
      ["Rewear Co.", "sales@rewear.test", "5550123", "hashed-password", "retail",
        "Rewear Co.", "REG-23", "Main Street"]
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User created successfully",
      user: {
        id: 23,
        fullName: "Rewear Co.",
        email: "sales@rewear.test",
        phone: "5550123",
        role: "retail"
      }
    });
  });

  it("rejects duplicate email before creating an account", async () => {
    db.promise.mockReturnValue({
      query: jest.fn().mockResolvedValueOnce([[{ id: 8 }]])
    });
    const req = {
      body: {
        role: "customer",
        fullName: "Alex",
        email: "alex@example.test",
        phone: "5550123",
        password: "secret1"
      }
    };
    const res = createResponse();

    await adminController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: "Email is already registered" });
    expect(bcrypt.hash).not.toHaveBeenCalled();
  });
});
