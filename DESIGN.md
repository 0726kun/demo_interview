# DESIGN.md

---

## 1. 需求分析

### 1.1 场景理解

题目设定为**资管公司内部 Web 工具**，目标用户是**渠道销售团队**。其日常工作可归纳为三类诉求：

| 诉求 | 说明 |
|------|------|
| **快速了解在售基金** | 需要查看产品类型、净值、规模、状态等关键信息，并能按维度筛选、按名称搜索，以便向客户推荐或解答疑问。 |
| **维护客户关系** | 需要维护客户基本信息，并记录每次跟进的日期、方式（电话/面访/微信等）、内容，形成可追溯的沟通历史。 |
| **双向查询** | 需要支持「某客户买了哪些产品」以及「某产品被哪些客户持有」，便于做交叉销售、续作提醒或风险排查。 |

因此从功能上拆分为三个核心模块：**产品货架**、**客户管理**、**数据概览**，并在数据层保证产品–客户–持有关系–跟进记录均可被上述场景查询与展示。

### 1.2 已做功能与原因

#### 产品货架

- **产品列表**：从服务端异步拉取，展示产品名称、类型、状态、净值、成立规模；支持按**类型**（股票型/债券型/混合型/货币型/指数型）、**状态**（运作中/募集中/已清盘/封闭期）筛选，以及按**名称**搜索。
- **产品详情**：点击列表项后以**右侧抽屉**形式展示，避免整页跳转；详情内包含名称、类型、最新净值、成立规模、状态、成立日，以及**持有该产品的客户列表**（调用 `getHoldersByProductId`），方便销售在做产品介绍时快速知道「谁在持」。
- **首屏数据**：产品列表页为 Server Component，首屏在服务端调用 `getProducts()` 直接出 HTML，无筛选时不再发起客户端请求；有筛选/搜索时由客户端请求 `/api/products?type=...&search=...`。

#### 客户管理

- **客户列表**：异步拉取客户名单，展示姓名、身份/渠道、电话；支持按**姓名或身份**搜索。
- **客户详情抽屉**：展示客户基本信息、**持有产品列表**（`getHoldingsByClientId`）、**跟进记录列表**（按日期倒序），以及**新增跟进**表单。
- **新增跟进**：表单含日期（默认今天）、方式（电话/面访/微信/邮件/其他）、内容（必填）；提交后调用 `POST /api/clients/[id]/follow-ups`，成功后刷新该客户的跟进列表并清空表单，便于连续录入。
- **首屏数据**：客户列表页同样为 Server Component，首屏由服务端 `getClients()` 出 HTML；有搜索时由客户端请求 `/api/clients?search=...`。

#### 数据概览

- **Dashboard 页**：一次请求 `GET /api/dashboard` 拉取 `{ products, clients, holdings, followUps }`，在客户端做聚合后渲染六个图表：
  1. **按产品类型的规模占比**（环形图）：各类型在管规模（亿元），便于分配推广重点。
  2. **按产品状态的数量**（柱状图）：运作中/募集中/已清盘/封闭期产品数量，了解在售结构。
  3. **产品规模 Top 6**（横向柱状图）：规模最大的六只产品，便于重点维护与续作。
  4. **客户持有产品数 Top 8**（横向柱状图）：持有产品数最多的客户，适合深度维护或交叉销售。
  5. **被持有最多的产品 Top 6**（柱状图）：客户覆盖最广的产品，可作主推或案例。
  6. **跟进方式分布**（环形图）：电话/面访/微信/邮件等占比，了解触达方式偏好。
- 图表使用 Recharts，配色与 Tooltip 使用项目内 CSS 变量（如 `var(--accent)`），与深色主题一致。

#### Agent 能力

- **入口**：右下角悬浮按钮（AgentFab），点击后打开**智能助手**侧边栏（AgentPanel）。
- **智能查询**：用户用自然语言提问，例如「张总持有哪些债券型产品」「稳健增长一号被谁持有」；服务端 `POST /api/agent/chat` 将用户输入与当前客户/产品名单一起发给 LLM（阿里云 DashScope，qwen-turbo），约束其只返回 JSON 意图（如 `holdings_of_client`、`holders_of_product`）；路由解析 JSON 后调用 store 的 `getHoldingsByClientId`、`getHoldersByProductId` 等，将结果整理成可读文案返回，前端以 **Markdown** 渲染（react-markdown），支持加粗、列表等。
- **辅助录入**：用户描述沟通内容，如「今天和李总电话聊了半小时，他对稳健增长一号有兴趣，打算下周认购 50 万」；LLM 解析为 `follow_up` 意图并提取客户名、方式、日期、内容；服务端返回 `followUpAction`（含 clientId、date、method、content）。前端展示「填入跟进表单」按钮，点击后通过 `AgentContext` 设置 `pendingFollowUp` 并跳转客户管理页，自动打开对应客户抽屉并将**新增跟进**表单预填（ClientDetailDrawer 的 `initialFollowUp`）；若 LLM 返回的 content 为空，服务端用用户原话作为跟进内容，避免内容为空。
- **打开数据概览**：用户说「打开数据概览」等，意图为 `navigate_dashboard`，返回 `navigatePath: "/dashboard"`，前端关闭面板并跳转。
- **未知意图**：当无法解析为上述意图时，返回友好问候与能力说明（你好，我是…可以为你做…），而非「暂未理解」。
- API Key 与 Base URL 当前在 `app/api/agent/chat/route.ts` 中硬编码。

#### 数据层与数据建模

- **类型定义**（`lib/types.ts`）：`Product`（id, name, type, nav, scale, status, establishedAt）、`Client`（id, name, contact?, phone?）、`Holding`（clientId, productId, amount?）、`FollowUp`（id, clientId, date, method, content）。
- **Mock 数据**（`lib/mock-data.ts`）：不少于 8 个产品、8 位客户，以及对应的持有关系与跟进记录；仅被服务端 `lib/server/store.ts` 引用，前端组件不直接 import。
- **数据流**：所有列表、详情、图表、Agent 查询均通过 `lib/api.ts` 的 `fetch('/api/...')` 或服务端直接调 store 获取，满足「模拟异步、组件不直接引用数据」的要求。

### 1.3 若时间有限暂未做的

- 产品/客户的**增删改**（题目未强制，当前仅做查询与跟进新增）。
- **持有关系维护**：客户「买了/赎回了」某产品的编辑入口，需与产品详情页「被哪些客户持有」保持一致。
- 按时间维度的跟进趋势图、按渠道的规模分布等（当前 Dashboard 已有六图，可再扩展）。

### 1.4 若再给 2 天会优先做

1. **持有关系维护**：在客户详情中支持「添加/移除持有产品」，并保证与产品详情页「被哪些客户持有」双向一致；可做简单校验（如不能重复添加）。
2. **产品/客户基础信息编辑**：名称、类型、状态等可编辑，统一走 API 层，便于后续接真实后端。
3. **加载/空/错误态**：列表与详情的 loading、空列表、请求失败态的统一展示与重试（如 toast + 重试按钮）。

---

## 2. 技术选型

### 2.1 整体思路

- 题目要求前端必须使用 **React**，其余选型自由；本方案采用 **Next.js（App Router）** 做全栈，服务端提供 API 与首屏数据，前端以 React 组件 + Tailwind 实现界面。
- 数据只在服务端维护（内存 store），前端通过 HTTP 消费；产品/客户列表首屏由 Server Component 从 store 取数，减少首屏请求与白屏时间。
- Agent 采用「LLM 只输出结构化意图、业务查询由现有 store 完成」的架构，便于控制成本与结果稳定性。

### 2.2 技术方案与选型理由

| 类别 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js (App Router) | 题目要求 React；Next.js 提供文件路由、API 路由、Server Component，部署友好，便于扩展。 |
| 样式 | Tailwind CSS v4 | 项目已集成；快速实现布局与主题，用 CSS 变量统一色板与字体，符合设计规范。 |
| 状态管理 | React 内置 state + Context（AgentContext） | 列表与详情以本地 state 为主；Agent 的 open、messages、pendingFollowUp 通过 Context 在 AgentPanel、AgentFab、ClientsView、ClientDetailDrawer 间共享。 |
| 数据请求 | 全栈：服务端 `lib/server/store.ts` + `app/api/*`；前端 `lib/api.ts` 使用 `fetch('/api/...')` | 数据仅在服务端维护；列表首屏由 Server Component 调 store 出 HTML；筛选/搜索/详情/图表/Agent 由客户端请求对应 API。 |
| 图表 | Recharts | 声明式 React 组件，与现有栈一致；用 CSS 变量统一图表色，与深色主题一致。 |
| 字体与主题 | Outfit（正文）+ Fraunces（标题），深色背景 + 琥珀色强调 | 避免通用字体与紫色渐变；资管内部工具采用偏专业、克制的风格。 |
| Agent | 阿里云 DashScope（qwen-turbo），OpenAI 兼容接口 | 服务端 `POST /api/agent/chat`：system prompt 约束 LLM 只输出 JSON 意图；解析后按 type 执行 store 查询，返回 content（可含 Markdown）+ 可选 followUpAction、navigatePath；API Key 与 Base URL 在 route 中硬编码。 |
| Agent 回复展示 | react-markdown | 助手回复中的加粗、列表等以 Markdown 渲染，提升可读性。 |

### 2.3 API 清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 产品列表，query: type?, status?, search? |
| GET | /api/products/[id] | 单个产品，404 时返回 404 |
| GET | /api/products/[id]/holders | 持有该产品的客户列表 |
| GET | /api/clients | 客户列表，query: search? |
| GET | /api/clients/[id] | 单个客户 |
| GET | /api/clients/[id]/holdings | 该客户持有的产品列表 |
| GET | /api/clients/[id]/follow-ups | 该客户的跟进记录列表 |
| POST | /api/clients/[id]/follow-ups | 新增跟进，body: { date, method?, content } |
| GET | /api/dashboard | 返回 { products, clients, holdings, followUps } |
| POST | /api/agent/chat | 请求体 { message }；返回 { content, followUpAction?, navigatePath? } |

### 2.4 架构图与数据流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Next.js App（全栈）                               │
├─────────────────────────────────────────────────────────────────────────┤
│  服务端                                                                   │
│  ├── app/api/                  Route Handlers（后端接口）                │
│  │   ├── products/             GET 列表、[id]、[id]/holders              │
│  │   ├── clients/              GET 列表、[id]、[id]/holdings、            │
│  │   │                         GET/POST [id]/follow-ups                   │
│  │   ├── dashboard/            GET { products, clients, holdings, followUps } │
│  │   └── agent/chat/           POST：LLM 解析意图 → store 查询 → 返回     │
│  │                             content / followUpAction / navigatePath   │
│  └── lib/server/store.ts       内存数据层（种子来自 mock-data）；          │
│                                仅被 app/api 与 Server Component 引用     │
├─────────────────────────────────────────────────────────────────────────┤
│  app/ 页面                                                                │
│  ├── layout.tsx                根布局（AppNav、AgentProvider、AgentFab、AgentPanel） │
│  ├── page.tsx                 首页（三入口卡片）                           │
│  ├── products/page.tsx        Server Component：getProducts() → ProductsView │
│  ├── clients/page.tsx         Server Component：getClients() → ClientsView  │
│  └── dashboard/page.tsx       Client：getDashboard() → 六图               │
├─────────────────────────────────────────────────────────────────────────┤
│  components                                                                │
│  ├── AppNav                   顶栏导航（产品货架 / 客户管理 / 数据概览）   │
│  ├── AgentFab                 右下角悬浮按钮，打开智能助手                  │
│  ├── AgentPanel               智能助手侧边栏（消息列表 + 输入；Markdown 渲染回复） │
│  ├── ProductsView             产品列表 + 筛选/搜索 + ProductDetailDrawer    │
│  ├── ClientsView              客户列表 + 搜索 + ClientDetailDrawer；        │
│  │                            消费 pendingFollowUp，打开对应客户并传 initialFollowUp │
│  ├── ProductDetailDrawer      产品详情 + 持有客户列表                       │
│  └── ClientDetailDrawer       客户详情 + 持有产品 + 跟进列表 + 新增跟进表单；│
│                               支持 initialFollowUp 预填（Agent「填入跟进表单」） │
├─────────────────────────────────────────────────────────────────────────┤
│  contexts/AgentContext.tsx     open、messages、sendMessage、              │
│                                pendingFollowUp、setPendingFollowUp、clearPendingFollowUp │
├─────────────────────────────────────────────────────────────────────────┤
│  lib/（前端可见）                                                          │
│  ├── types.ts                 共享类型（Product、Client、Holding、FollowUp） │
│  ├── mock-data.ts             种子数据，仅被 lib/server/store 引用         │
│  └── api.ts                   fetch 调用 /api/*，供客户端组件使用          │
└─────────────────────────────────────────────────────────────────────────┘
```

- **列表首屏**：产品/客户页由 Server Component 在服务端调 store 出 HTML，无筛选时不再发请求。
- **筛选/搜索/详情**：客户端通过 `lib/api.ts` 请求对应 `/api/*`，拿到数据后更新 state 并渲染。
- **Agent 流**：用户输入 → 前端 `POST /api/agent/chat` → 服务端用 LLM 得到 JSON 意图 → 按 type 调 store 查数据 → 返回 content（+ 可选 followUpAction、navigatePath）；若为 followUpAction，前端跳转客户页、打开对应客户抽屉并预填表单（initialFollowUp）。
- **后续扩展**：真实后端可替换 `lib/server/store.ts` 为 DB 访问；Agent Key 可改为环境变量或密钥服务。

---

## 3. AI 协作日志

### 3.1 示例一：数据模型与 API 设计

- **Prompt**：要求设计基金产品、客户、持有关系、跟进记录的数据结构，并约定「组件不直接 import 数据、通过异步 API 获取」。
- **AI 输出**：给出了 `Product` / `Client` / `Holding` / `FollowUp` 的 TypeScript 类型定义，以及 `getProducts`、`getProductById`、`getHoldingsByClientId`、`getFollowUpsByClientId`、`addFollowUp` 等接口命名与参数建议；并建议用 `setTimeout` 模拟延迟。
- **采纳/修改**：**采纳**类型与接口划分；实现时**补充**了 `getHoldersByProductId`（某产品被哪些客户持有）、筛选参数（type/status/search），以及 Dashboard 所需的 `getAllProducts` / `getAllHoldings` / `getAllClients`（后统一为 `getDashboard()`），使三个模块与图表都能复用同一套 API。

### 3.2 示例二：Dashboard 图表选型与业务含义

- **Prompt**：数据概览需要至少两个有业务含义的图表，销售团队要能快速把握业务全貌，用什么图表库、做什么图？
- **AI 输出**：建议使用 Recharts；推荐「按产品类型汇总规模」做饼图/环形图、「按状态的产品数量」或「客户持有产品数排行」做柱状图，并给出 Recharts 的 `PieChart`、`BarChart`、`ResponsiveContainer` 等用法示例。
- **采纳/修改**：**采纳** Recharts 与「类型规模占比 + 客户持有数 Top N」；**修改**为类型用环形图（innerRadius）、客户用横向柱状图（客户名在 Y 轴），并扩展为六图（增加按状态数量、产品规模 Top6、被持有最多产品 Top6、跟进方式分布），统一使用项目 CSS 变量作为图表色与 Tooltip 样式。

### 3.3 示例三：Agent 与 LLM 接入

- **Prompt**：需要接入真实 LLM（用户提供 DashScope API Key 与 Base URL），让 Agent 能理解自然语言并查业务数据。
- **AI 输出**：建议服务端单独提供 `POST /api/agent/chat`，用 system prompt 约束 LLM 只输出 JSON 意图（holders_of_product、holdings_of_client、follow_up、navigate_dashboard），再在 route 内根据 intent 调 store 查数据并返回 content / followUpAction / navigatePath；前端只发 message、展示回复与「填入跟进表单」按钮。
- **采纳/修改**：**采纳**该架构；实现时按用户要求将 API Key 与 Base URL 在 route 内硬编码；未知意图时改为**友好问候 + 能力说明**；后续补充「LLM 返回 content 为空时用用户原话作为跟进内容」，避免「填入跟进表单」后内容为空；助手回复用 react-markdown 渲染。

### 3.4 AI 帮最多 / 最帮不上的地方

- **帮最多**：快速产出类型定义、API 命名与 Mock 数据结构，以及 Recharts 的组装方式，减少查文档时间；在「产品详情展示持有客户」「客户详情展示持有产品」等业务逻辑上，能一次性给出前后端一致的关系设计；Agent 的「意图 → store 查询」流程与 system prompt 设计也由 AI 协助梳理。
- **最帮不上**：具体项目的**审美细节**（深色 + 琥珀色、Outfit/Fraunces 的搭配）需要人工定方向后再让 AI 落代码；**边界与异常**（请求失败重试、空状态文案、LLM 返回空 content 的 fallback）需要自己梳理场景后补充，AI 容易只给「理想路径」的代码。

---

## 4. 自我复盘

### 4.1 当前实现中已知但未修的问题
- **无障碍与语义**：图表已做 `aria-labelledby`，但列表页「点击整卡进入详情」对键盘用户不够友好，未做焦点管理与 Escape 关闭抽屉的显式说明。

### 4.2 若是真实企业项目会做哪些不同决策

### 一、安全与权限管控：贴合企业内控要求，杜绝数据泄露风险

Demo版本通常忽略权限和安全校验，但真实企业项目必须优先补齐安全短板。首先会搭建完整的账号登录体系，按岗位角色做精细化权限拆分，比如销售岗仅能查看和维护自己负责的客户、跟进记录，无权修改其他同事的客户数据，管理员则拥有全量数据查看、配置及人员权限管理权限，彻底避免越权操作。同时接口层面会做严格校验，所有后端API请求必须携带有效身份token，无token或token过期直接拦截拒绝访问；针对新增跟进、修改客户信息这类敏感操作，会单独留存操作审计日志，记录操作人、操作时间、具体内容，方便后续溯源排查。另外像Agent API Key这类核心密钥，绝对不会硬编码到代码里提交到仓库，而是统一托管到专业密钥管理服务，或者配置到服务器环境变量中，从源头杜绝密钥泄露引发的安全问题。

### 二、后端与数据层：适配真实业务流转，保障数据可靠可查

Demo阶段大多用本地模拟数据或内存数据，无法支撑实际业务使用，真实项目会直接对接企业正式后端服务，根据技术选型选用REST接口或者tRPC框架，实现产品信息、客户资料、客户-产品持有关系、销售跟进记录等核心数据的持久化落库，彻底告别临时数据。数据查询层面也会优化逻辑，支持按跟进时间、客户归属、产品类型等多维度筛选，尤其是按时间范围批量查询历史记录的功能，完全贴合销售日常工作需求。针对高频率查询的产品列表这类数据，还会考虑引入缓存机制并设置合理的过期时间，同时根据后期数据量规划读写分离，缓解数据库查询压力，保障系统响应速度。

### 三、工程化与质量保障：建立标准化流程，规避线上故障

真实企业项目不会只追求功能上线，更看重代码质量和系统稳定性，会补齐Demo阶段省略的测试和工程化环节。首先针对接口请求层、数据聚合处理的核心逻辑，编写完整的单元测试用例，覆盖正常调用、异常报错、边界情况等多种场景，避免代码修改引发连锁bug；核心业务流程比如“产品搜索→查看详情→新增跟进记录”“Agent智能查询→自动回填跟进表单”，会单独做E2E端到端测试，模拟真实用户操作流程，确保全链路功能正常。同时搭建CI持续集成流程，代码提交后自动运行代码校验、单元测试、项目构建，任一环节不通过直接阻断部署，从流程上杜绝问题代码上线，保障线上环境稳定。

### 四、用户体验与可观测性：优化交互体验，便于线上问题排查

在用户体验和运维排查上，真实项目也会做精细化优化。接口请求失败时，不会直接抛出原生报错，而是设置统一的错误边界处理，给出清晰的用户提示，支持一键重试请求，减少用户操作障碍；新增跟进、修改客户信息这类关键操作完成后，用轻量提示框做即时反馈，让用户明确操作结果。上线到生产环境后，还会接入前端监控系统，实时上报页面报错、接口异常信息，同时对核心操作做埋点统计，既能快速定位线上问题，缩短排查时间，也能通过用户行为数据指导后续产品迭代，让功能优化更贴合实际使用需求。
