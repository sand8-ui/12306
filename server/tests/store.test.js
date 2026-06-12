const assert = require("node:assert/strict");
const test = require("node:test");
const { createStore } = require("../src/domain/store");

test("purchase then refund updates ticket status and seats", () => {
  const store = createStore();
  const login = store.login({ username: "13800000001", password: "password123" });
  const trains = store.queryTrains({ date: "2026-06-01", from: "武汉", to: "北京" });
  const targetTrain = trains[0];
  const beforeSeats = targetTrain.availableSeats;

  const ticket = store.purchaseTicket(login.token, {
    trainId: targetTrain.id,
    passengerName: "张三",
  });

  assert.equal(ticket.status, "PAID");
  assert.equal(store.queryTrains({ date: "2026-06-01", from: "武汉", to: "北京" })[0].availableSeats, beforeSeats - 1);

  const refunded = store.refundTicket(login.token, { ticketId: ticket.id });

  assert.equal(refunded.status, "REFUNDED");
  assert.equal(refunded.refundFee, 82.95);
  assert.equal(refunded.refundAmount, 470.05);
  assert.equal(store.queryTrains({ date: "2026-06-01", from: "武汉", to: "北京" })[0].availableSeats, beforeSeats);
});

test("change ticket creates new paid ticket and marks source changed", () => {
  const store = createStore();
  const login = store.login({ username: "13800000001", password: "password123" });
  const trains = store.queryTrains({ date: "2026-06-01", from: "武汉", to: "北京" });
  const first = trains[0];
  const second = trains[1];

  const original = store.purchaseTicket(login.token, {
    trainId: first.id,
    passengerName: "张三",
  });

  const changed = store.changeTicket(login.token, {
    ticketId: original.id,
    newTrainId: second.id,
  });

  const tickets = store.listMyTickets(login.token);
  const source = tickets.find((ticket) => ticket.id === original.id);

  assert.equal(changed.status, "PAID");
  assert.equal(changed.sourceTicketId, original.id);
  assert.equal(changed.changeFee, 27.65);
  assert.equal(changed.paymentChannel, "mock-bank-gateway");
  assert.equal(source.status, "CHANGED");
  assert.equal(source.changeFee, 27.65);
});

test("register requires bank card and returns verified passenger profile", () => {
  const store = createStore();
  const user = store.registerPassenger({
    name: "李四",
    username: "lisi",
    phone: "13812345678",
    password: "abc12345",
    idCard: "420111199902021234",
    bankCard: "6222029999998888777",
  });

  assert.equal(user.verified, true);
  assert.equal(user.bankCardMasked, "**** **** **** 8777");
  assert.equal(user.verificationChannel, "mock-citizen-service");
});
