const seedUsers = [
  {
    id: "u-passenger-1",
    role: "PASSENGER",
    name: "张三",
    username: "13800000001",
    phone: "13800000001",
    password: "password123",
    idCard: "420111199901011234",
  },
  {
    id: "u-admin-1",
    role: "ADMIN",
    name: "系统管理员",
    username: "admin",
    phone: "13900000000",
    password: "admin123",
    idCard: "000000000000000000",
  },
];

const seedTrains = [
  {
    id: "G1001",
    trainNo: "G1001",
    date: "2026-06-01",
    from: "武汉",
    to: "北京",
    departTime: "08:30",
    arriveTime: "13:52",
    seatType: "二等座",
    price: 553,
    availableSeats: 18,
    status: "ON_SALE",
  },
  {
    id: "G1005",
    trainNo: "G1005",
    date: "2026-06-01",
    from: "武汉",
    to: "北京",
    departTime: "10:20",
    arriveTime: "15:48",
    seatType: "二等座",
    price: 568,
    availableSeats: 12,
    status: "ON_SALE",
  },
  {
    id: "D2201",
    trainNo: "D2201",
    date: "2026-06-01",
    from: "武汉",
    to: "长沙",
    departTime: "09:10",
    arriveTime: "11:06",
    seatType: "一等座",
    price: 169,
    availableSeats: 25,
    status: "ON_SALE",
  },
  {
    id: "G4312",
    trainNo: "G4312",
    date: "2026-06-02",
    from: "上海",
    to: "南京",
    departTime: "07:40",
    arriveTime: "09:06",
    seatType: "二等座",
    price: 139,
    availableSeats: 0,
    status: "ON_SALE",
  },
];

const seedSettings = {
  salesOpen: true,
  refundRate: 0.15,
  changeRate: 0.05,
  serviceNotice: "Mini-12306 演示系统已开放购票、退票和改签。",
};

module.exports = {
  seedUsers,
  seedTrains,
  seedSettings,
};
