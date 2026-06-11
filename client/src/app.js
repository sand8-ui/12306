const { useEffect, useState } = React;

const API_BASE = "http://localhost:3000/api";

function App() {
  const [tab, setTab] = useState("login");
  const [bootstrap, setBootstrap] = useState({ trains: [], settings: null });
  const [message, setMessage] = useState(null);
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("mini12306-auth");
    return saved ? JSON.parse(saved) : { token: "", user: null };
  });
  const [loginForm, setLoginForm] = useState({ username: "13800000001", password: "password123" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    username: "",
    phone: "",
    password: "",
    idCard: "",
  });
  const [queryForm, setQueryForm] = useState({ date: "2026-06-01", from: "武汉", to: "北京" });
  const [trains, setTrains] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [adminSettings, setAdminSettings] = useState({
    salesOpen: true,
    refundRate: 0.15,
    changeRate: 0.05,
    serviceNotice: "",
  });

  useEffect(() => {
    localStorage.setItem("mini12306-auth", JSON.stringify(auth));
  }, [auth]);

  useEffect(() => {
    fetch(`${API_BASE}/bootstrap`)
      .then((res) => res.json())
      .then((data) => {
        setBootstrap(data);
        if (data.settings) {
          setAdminSettings(data.settings);
        }
      })
      .catch(() => {
        setMessage({ type: "error", text: "初始化数据加载失败，请确认后端已启动。" });
      });
  }, []);

  useEffect(() => {
    if (auth.token) {
      loadTickets();
      if (auth.user?.role === "ADMIN") {
        loadAdminSettings();
      }
    }
  }, [auth.token]);

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    if (auth.token) {
      headers.Authorization = `Bearer ${auth.token}`;
    }
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "请求失败。");
    }
    return data;
  }

  async function handleLogin(event) {
    event.preventDefault();
    try {
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      setAuth(data);
      showMessage("success", `欢迎，${data.user.name}。`);
      setTab("query");
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    try {
      await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });
      showMessage("success", "注册成功，请使用新账号登录。");
      setTab("login");
      setLoginForm({ username: registerForm.username, password: registerForm.password });
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleQuery(event) {
    event.preventDefault();
    try {
      const params = new URLSearchParams(queryForm);
      const data = await request(`/trains?${params.toString()}`, { method: "GET" });
      setTrains(data.trains);
      showMessage("success", `查询到 ${data.trains.length} 条车次。`);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handlePurchase(trainId) {
    if (!auth.token) {
      showMessage("error", "请先登录后再购票。");
      return;
    }
    try {
      await request("/tickets/purchase", {
        method: "POST",
        body: JSON.stringify({ trainId, passengerName: auth.user.name }),
      });
      await loadTickets();
      await refreshAllViews();
      showMessage("success", "购票成功，订单已加入我的车票。");
      setTab("tickets");
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function loadTickets() {
    try {
      const data = await request("/tickets", { method: "GET" });
      setTickets(data.tickets);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleRefund(ticketId) {
    try {
      await request("/tickets/refund", {
        method: "POST",
        body: JSON.stringify({ ticketId }),
      });
      await loadTickets();
      await refreshAllViews();
      showMessage("success", "退票成功。");
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleChange(ticketId, currentTrainId) {
    const candidate = trains.find((train) => train.id !== currentTrainId && train.availableSeats > 0);
    if (!candidate) {
      showMessage("error", "当前查询结果中没有可用于改签的其他车次。");
      return;
    }
    try {
      await request("/tickets/change", {
        method: "POST",
        body: JSON.stringify({ ticketId, newTrainId: candidate.id }),
      });
      await loadTickets();
      await refreshAllViews();
      showMessage("success", `改签成功，已改到 ${candidate.trainNo}。`);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function refreshBootstrap() {
    const data = await request("/bootstrap", { method: "GET" });
    setBootstrap(data);
    if (auth.user?.role === "ADMIN") {
      setAdminSettings(data.settings);
    }
  }

  async function refreshAllViews() {
    await refreshBootstrap();
    if (queryForm.date && queryForm.from && queryForm.to) {
      const params = new URLSearchParams(queryForm);
      const data = await request(`/trains?${params.toString()}`, { method: "GET" });
      setTrains(data.trains);
    }
  }

  async function loadAdminSettings() {
    try {
      const data = await request("/admin/settings", { method: "GET" });
      setAdminSettings(data.settings);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault();
    try {
      const payload = {
        salesOpen: Boolean(adminSettings.salesOpen),
        refundRate: Number(adminSettings.refundRate),
        changeRate: Number(adminSettings.changeRate),
        serviceNotice: adminSettings.serviceNotice,
      };
      const data = await request("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setAdminSettings(data.settings);
      setBootstrap((current) => ({ ...current, settings: data.settings }));
      showMessage("success", "系统设置已更新。");
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  function logout() {
    setAuth({ token: "", user: null });
    setTickets([]);
    showMessage("success", "已退出登录。");
    setTab("login");
  }

  const userLabel = auth.user
    ? `${auth.user.name} · ${auth.user.role === "ADMIN" ? "管理员" : "旅客"}`
    : "未登录";

  return (
    <div className="page">
      <div className="shell">
        <section className="hero">
          <h1>Mini-12306 车票服务系统</h1>
          <p>
            对应实验报告中的 Node.js + React 版本实现，支持旅客注册、登录、查询车次、购票、退票、改签，以及管理员系统设置。
          </p>
          <div className="hero-badges">
            <span className="badge">演示账号：13800000001 / password123</span>
            <span className="badge">管理员：admin / admin123</span>
            <span className="badge">当前状态：{bootstrap.settings?.salesOpen ? "开放购票" : "暂停购票"}</span>
          </div>
        </section>

        <div className="layout">
          <aside className="stack">
            <div className="card">
              <div className="card-inner stack">
                <div className="section-title">
                  <h2>用户面板</h2>
                  <span className="pill">{userLabel}</span>
                </div>
                <div className="tabs">
                  <button className={tab === "login" ? "active" : "secondary"} onClick={() => setTab("login")}>
                    登录
                  </button>
                  <button className={tab === "register" ? "active" : "secondary"} onClick={() => setTab("register")}>
                    注册
                  </button>
                  <button className={tab === "query" ? "active" : "secondary"} onClick={() => setTab("query")}>
                    查询车次
                  </button>
                  <button className={tab === "tickets" ? "active" : "secondary"} onClick={() => setTab("tickets")}>
                    我的车票
                  </button>
                  {auth.user?.role === "ADMIN" && (
                    <button className={tab === "admin" ? "active" : "secondary"} onClick={() => setTab("admin")}>
                      系统设置
                    </button>
                  )}
                </div>

                {message && <div className={`alert ${message.type}`}>{message.text}</div>}

                {tab === "login" && (
                  <form className="grid" onSubmit={handleLogin}>
                    <label>
                      账号
                      <input
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        placeholder="手机号或管理员账号"
                      />
                    </label>
                    <label>
                      密码
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      />
                    </label>
                    <div className="actions">
                      <button className="primary" type="submit">
                        登录
                      </button>
                      {auth.token && (
                        <button className="ghost" type="button" onClick={logout}>
                          退出
                        </button>
                      )}
                    </div>
                  </form>
                )}

                {tab === "register" && (
                  <form className="grid" onSubmit={handleRegister}>
                    <label>
                      姓名
                      <input value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} />
                    </label>
                    <label>
                      用户名
                      <input value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
                    </label>
                    <label>
                      手机号
                      <input value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
                    </label>
                    <label>
                      身份证号
                      <input value={registerForm.idCard} onChange={(e) => setRegisterForm({ ...registerForm, idCard: e.target.value })} />
                    </label>
                    <label>
                      密码
                      <input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
                    </label>
                    <button className="primary" type="submit">
                      提交注册
                    </button>
                  </form>
                )}

                {tab === "query" && (
                  <form className="grid" onSubmit={handleQuery}>
                    <div className="grid two">
                      <label>
                        出发日期
                        <input type="date" value={queryForm.date} onChange={(e) => setQueryForm({ ...queryForm, date: e.target.value })} />
                      </label>
                      <label>
                        出发站
                        <input value={queryForm.from} onChange={(e) => setQueryForm({ ...queryForm, from: e.target.value })} />
                      </label>
                    </div>
                    <label>
                      到达站
                      <input value={queryForm.to} onChange={(e) => setQueryForm({ ...queryForm, to: e.target.value })} />
                    </label>
                    <div className="actions">
                      <button className="primary" type="submit">
                        查询车次
                      </button>
                      <button className="secondary" type="button" onClick={loadTickets}>
                        刷新我的车票
                      </button>
                    </div>
                  </form>
                )}

                {tab === "tickets" && (
                  <div className="stack">
                    <div className="notice">改签会优先使用当前查询结果中的另一趟可售车次。建议先查询同线路多趟车次，再执行改签演示。</div>
                    <button className="secondary" type="button" onClick={loadTickets}>
                      刷新车票列表
                    </button>
                  </div>
                )}

                {tab === "admin" && auth.user?.role === "ADMIN" && (
                  <form className="grid" onSubmit={handleSaveSettings}>
                    <label>
                      是否开放购票
                      <select
                        value={String(adminSettings.salesOpen)}
                        onChange={(e) =>
                          setAdminSettings({ ...adminSettings, salesOpen: e.target.value === "true" })
                        }
                      >
                        <option value="true">开放</option>
                        <option value="false">关闭</option>
                      </select>
                    </label>
                    <div className="grid two">
                      <label>
                        退票手续费比例
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={adminSettings.refundRate}
                          onChange={(e) => setAdminSettings({ ...adminSettings, refundRate: e.target.value })}
                        />
                      </label>
                      <label>
                        改签手续费比例
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={adminSettings.changeRate}
                          onChange={(e) => setAdminSettings({ ...adminSettings, changeRate: e.target.value })}
                        />
                      </label>
                    </div>
                    <label>
                      服务公告
                      <textarea
                        value={adminSettings.serviceNotice}
                        onChange={(e) => setAdminSettings({ ...adminSettings, serviceNotice: e.target.value })}
                      />
                    </label>
                    <button className="primary" type="submit">
                      保存设置
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-inner stack">
                <div className="section-title">
                  <h3>系统公告</h3>
                </div>
                <div className="notice">{bootstrap.settings?.serviceNotice || "暂无公告"}</div>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>销售状态</strong>
                    <span>{bootstrap.settings?.salesOpen ? "开放" : "关闭"}</span>
                  </div>
                  <div className="info-item">
                    <strong>退票手续费</strong>
                    <span>{Math.round((bootstrap.settings?.refundRate || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="stack">
            <div className="card">
              <div className="card-inner">
                <div className="section-title">
                  <h2>车次查询结果</h2>
                  <span className="muted">按报告要求展示时间、席别、价格和余票</span>
                </div>
                <div className="train-list">
                  {trains.length === 0 && <div className="muted">当前还没有查询结果。</div>}
                  {trains.map((train) => (
                    <div className="train-card" key={train.id}>
                      <div className="train-top">
                        <div>
                          <div className="train-route">
                            {train.from} → {train.to}
                          </div>
                          <div className="muted">
                            {train.trainNo} · {train.date} · {train.departTime} - {train.arriveTime}
                          </div>
                        </div>
                        <span className="pill">{train.seatType}</span>
                      </div>
                      <div className="train-meta">
                        <span>票价：¥{train.price}</span>
                        <span>余票：{train.availableSeats}</span>
                        <span>状态：{train.status === "ON_SALE" ? "可售" : "不可售"}</span>
                      </div>
                      <div className="actions" style={{ marginTop: 14 }}>
                        <button
                          className="primary"
                          onClick={() => handlePurchase(train.id)}
                          disabled={train.availableSeats <= 0}
                        >
                          购买此票
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-inner">
                <div className="section-title">
                  <h2>我的车票</h2>
                  <span className="muted">支持退票和改签</span>
                </div>
                <div className="ticket-list">
                  {tickets.length === 0 && <div className="muted">登录后可查看当前用户订单。</div>}
                  {tickets.map((ticket) => (
                    <div className="ticket-card" key={ticket.id}>
                      <div className="ticket-top">
                        <div>
                          <strong>
                            {ticket.trainNo} · {ticket.passengerName}
                          </strong>
                          <div className="muted">
                            {ticket.date} · {ticket.from} → {ticket.to}
                          </div>
                        </div>
                        <span className={`status ${ticket.status}`}>{ticket.status}</span>
                      </div>
                      <div className="ticket-meta">
                        <span>发车：{ticket.departTime}</span>
                        <span>到达：{ticket.arriveTime}</span>
                        <span>席别：{ticket.seatType}</span>
                        <span>票价：¥{ticket.price}</span>
                        {ticket.sourceTicketId && <span>来源车票：{ticket.sourceTicketId}</span>}
                      </div>
                      {ticket.status === "PAID" && (
                        <div className="actions" style={{ marginTop: 14 }}>
                          <button className="warn" onClick={() => handleRefund(ticket.id)}>
                            退票
                          </button>
                          <button className="secondary" onClick={() => handleChange(ticket.id, ticket.trainId)}>
                            改签到其他车次
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
