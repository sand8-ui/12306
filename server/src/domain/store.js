const { seedUsers, seedTrains, seedSettings } = require("../../data/seed");
const { clone, createId, nowIso } = require("../lib/utils");

function createStore() {
  const state = {
    users: clone(seedUsers),
    trains: clone(seedTrains),
    tickets: [],
    settings: clone(seedSettings),
    sessions: {},
  };

  function reset() {
    state.users = clone(seedUsers);
    state.trains = clone(seedTrains);
    state.tickets = [];
    state.settings = clone(seedSettings);
    state.sessions = {};
  }

  function sanitizeUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  function createSession(user) {
    const token = createId("token");
    state.sessions[token] = { userId: user.id, role: user.role, createdAt: nowIso() };
    return token;
  }

  function getUserByToken(token) {
    const session = state.sessions[token];
    if (!session) {
      return null;
    }
    return state.users.find((user) => user.id === session.userId) || null;
  }

  function registerPassenger(payload) {
    const { name, username, phone, password, idCard } = payload;
    if (!name || !username || !phone || !password || !idCard) {
      throw new Error("注册信息不完整。");
    }
    if (String(password).length < 6) {
      throw new Error("密码长度不能少于 6 位。");
    }
    if (state.users.some((user) => user.username === username || user.phone === phone)) {
      throw new Error("用户名或手机号已存在。");
    }
    const user = {
      id: createId("u"),
      role: "PASSENGER",
      name,
      username,
      phone,
      password,
      idCard,
    };
    state.users.push(user);
    return sanitizeUser(user);
  }

  function login(payload) {
    const { username, password } = payload;
    if (!username || !password) {
      throw new Error("请输入账号和密码。");
    }
    const user = state.users.find(
      (item) => item.username === username || item.phone === username
    );
    if (!user || user.password !== password) {
      throw new Error("账号或密码错误。");
    }
    const token = createSession(user);
    return {
      token,
      user: sanitizeUser(user),
    };
  }

  function requireUser(token) {
    const user = getUserByToken(token);
    if (!user) {
      throw new Error("登录状态无效，请重新登录。");
    }
    return user;
  }

  function requireAdmin(token) {
    const user = requireUser(token);
    if (user.role !== "ADMIN") {
      throw new Error("需要管理员权限。");
    }
    return user;
  }

  function queryTrains(params) {
    const { date, from, to } = params;
    if (!date || !from || !to) {
      throw new Error("请完整填写出发日期、出发站和到达站。");
    }
    return state.trains.filter(
      (train) => train.date === date && train.from === from && train.to === to
    );
  }

  function findTrain(trainId) {
    return state.trains.find((train) => train.id === trainId);
  }

  function findTicket(ticketId) {
    return state.tickets.find((ticket) => ticket.id === ticketId);
  }

  function ensureSalesOpen() {
    if (!state.settings.salesOpen) {
      throw new Error("当前系统未开放购票。");
    }
  }

  function ensureTrainCanSell(train) {
    if (!train) {
      throw new Error("车次不存在。");
    }
    if (train.status !== "ON_SALE") {
      throw new Error("该车次当前不可售。");
    }
    if (train.availableSeats <= 0) {
      throw new Error("该车次余票不足。");
    }
  }

  function purchaseTicket(token, payload) {
    const user = requireUser(token);
    ensureSalesOpen();
    const { trainId, passengerName } = payload;
    if (!trainId || !passengerName) {
      throw new Error("购票信息不完整。");
    }
    const train = findTrain(trainId);
    ensureTrainCanSell(train);
    train.availableSeats -= 1;
    const ticket = {
      id: createId("t"),
      userId: user.id,
      trainId: train.id,
      trainNo: train.trainNo,
      passengerName,
      date: train.date,
      from: train.from,
      to: train.to,
      departTime: train.departTime,
      arriveTime: train.arriveTime,
      seatType: train.seatType,
      price: train.price,
      status: "PAID",
      sourceTicketId: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.tickets.push(ticket);
    return clone(ticket);
  }

  function listMyTickets(token) {
    const user = requireUser(token);
    return state.tickets
      .filter((ticket) => ticket.userId === user.id)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map(clone);
  }

  function refundTicket(token, payload) {
    const user = requireUser(token);
    const { ticketId } = payload;
    const ticket = findTicket(ticketId);
    if (!ticket) {
      throw new Error("车票不存在。");
    }
    if (ticket.userId !== user.id) {
      throw new Error("不能操作他人车票。");
    }
    if (ticket.status !== "PAID") {
      throw new Error("只有已支付车票可以退票。");
    }
    const train = findTrain(ticket.trainId);
    if (train) {
      train.availableSeats += 1;
    }
    ticket.status = "REFUNDED";
    ticket.updatedAt = nowIso();
    return clone(ticket);
  }

  function changeTicket(token, payload) {
    const user = requireUser(token);
    ensureSalesOpen();
    const { ticketId, newTrainId } = payload;
    const ticket = findTicket(ticketId);
    if (!ticket) {
      throw new Error("原车票不存在。");
    }
    if (ticket.userId !== user.id) {
      throw new Error("不能操作他人车票。");
    }
    if (ticket.status !== "PAID") {
      throw new Error("只有已支付车票可以改签。");
    }
    if (!newTrainId || newTrainId === ticket.trainId) {
      throw new Error("改签车次必须与原车次不同。");
    }
    const oldTrain = findTrain(ticket.trainId);
    const newTrain = findTrain(newTrainId);
    ensureTrainCanSell(newTrain);
    if (oldTrain) {
      oldTrain.availableSeats += 1;
    }
    newTrain.availableSeats -= 1;
    ticket.status = "CHANGED";
    ticket.updatedAt = nowIso();
    const newTicket = {
      id: createId("t"),
      userId: user.id,
      trainId: newTrain.id,
      trainNo: newTrain.trainNo,
      passengerName: ticket.passengerName,
      date: newTrain.date,
      from: newTrain.from,
      to: newTrain.to,
      departTime: newTrain.departTime,
      arriveTime: newTrain.arriveTime,
      seatType: newTrain.seatType,
      price: newTrain.price,
      status: "PAID",
      sourceTicketId: ticket.id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.tickets.push(newTicket);
    return clone(newTicket);
  }

  function getSettings(token) {
    requireAdmin(token);
    return clone(state.settings);
  }

  function updateSettings(token, payload) {
    requireAdmin(token);
    const next = { ...state.settings, ...payload };
    if (typeof next.salesOpen !== "boolean") {
      throw new Error("salesOpen 必须为布尔值。");
    }
    if (typeof next.refundRate !== "number" || next.refundRate < 0 || next.refundRate > 1) {
      throw new Error("refundRate 必须在 0 到 1 之间。");
    }
    if (typeof next.changeRate !== "number" || next.changeRate < 0 || next.changeRate > 1) {
      throw new Error("changeRate 必须在 0 到 1 之间。");
    }
    state.settings = next;
    return clone(state.settings);
  }

  function getPublicSnapshot() {
    return {
      trains: clone(state.trains),
      settings: clone(state.settings),
    };
  }

  return {
    reset,
    registerPassenger,
    login,
    queryTrains,
    purchaseTicket,
    listMyTickets,
    refundTicket,
    changeTicket,
    getSettings,
    updateSettings,
    getPublicSnapshot,
    requireUser,
  };
}

module.exports = {
  createStore,
};
