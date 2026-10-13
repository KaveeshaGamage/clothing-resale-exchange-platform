jest.mock("../config/db", () => ({
  query: jest.fn(),
  promise: jest.fn()
}));

const db = require("../config/db");
const Order = require("./Order");

describe("Order customer reads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads the most recently updated delivery status for the customer order", (done) => {
    db.query.mockImplementation((sql, params, callback) => {
      expect(params).toEqual([42]);
      expect(sql).toContain("ORDER BY d.updated_at DESC, d.id DESC");
      expect(sql).toContain("LIMIT 1");
      expect(sql).toContain("AS delivery_status");
      callback(null, [{ id: 9, delivery_status: "in_transit" }]);
    });

    Order.getOrdersByBuyer(42, (error, orders) => {
      expect(error).toBeNull();
      expect(orders).toEqual([{ id: 9, delivery_status: "in_transit" }]);
      done();
    });
  });
});

describe("Order.cancelOrder", () => {
  it("cancels related deliveries and restores product stock in one transaction", async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn()
    };
    db.promise.mockReturnValue({
      getConnection: jest.fn().mockResolvedValue(connection)
    });

    const result = await new Promise((resolve, reject) => {
      Order.cancelOrder(9, 42, (error, data) => {
        if (error) reject(error);
        else resolve(data);
      });
    });

    expect(result.affectedRows).toBe(1);
    expect(connection.query).toHaveBeenCalledTimes(3);
    expect(connection.query.mock.calls[1][0]).toContain("delivery_status = 'cancelled'");
    expect(connection.query.mock.calls[2][0]).toContain("p.quantity = p.quantity + oi.quantity");
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });
});
