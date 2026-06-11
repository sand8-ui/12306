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
  assert.equal(source.status, "CHANGED");
});
