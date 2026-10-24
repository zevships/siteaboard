# SiteAboard · 站舱

**把你的站点，带上同一艘船。** 面向独立开发者和出海建站者的开源运营工作台，
目标是在本机管理站点，并让你已有的 coding agent 通过 CLI 与 skills 协作。

[在线演示](https://zevships.github.io/siteaboard/) · [English](README.md) ·
[整体架构](docs/architecture.md) · [路线图](docs/roadmap.md)

## 当前可以体验

这是第一版**静态前端框架，全部数据均为虚构样例**：

- 总览、站点、搜索、动态、连接、指南六个独立懒加载页面。
- 海洋、港湾、落日三种配色；浅色、深色、跟随系统；中英文切换。
- 顶栏导航与手机、平板、桌面布局、键盘导航、图表数据表、最近 7/30 天切换、按站点组织的运营卡片与详情页流程。
- GitHub Actions 检查与 GitHub Pages 自动部署。

连接和指南页面仅展示后续工作流。目前没有真实账号接入、本地数据库、埋点接收、
CLI 或 agent skills，不会把演示数据当成真实运营结果。

应用没有埋点、外部字体和模型调用；浏览器只保存配色、明暗和语言偏好。
GitHub 作为托管方仍可能按其政策处理普通访问日志。

## 本地启动

需要 **Node.js 26.x** 和 **pnpm 10.20.0**：

```sh
git clone https://github.com/zevships/siteaboard.git
cd siteaboard
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://127.0.0.1:4310。无需账号、密钥或相邻项目。
当前启动的是本地静态演示，正式本地服务在后续阶段实现。

```sh
pnpm format:check
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm preview
```

截图和测试产物保存在忽略的 `.local/` 中。

## 目录与扩展

| 目录                                               | 职责与现状                                         |
| -------------------------------------------------- | -------------------------------------------------- |
| `apps/admin/src/pages/`                            | 每个页面一个目录和默认组件，已经实现               |
| `apps/admin/src/app/`                              | 导航注册和路由懒加载                               |
| `apps/admin/src/components/`                       | 公共布局、基础组件、图表与表格                     |
| `apps/admin/src/providers/`、`locales/`、`styles/` | 全局偏好、双语文案、语义主题变量                   |
| `apps/admin/src/data/`                             | 合成演示数据                                       |
| `packages/core/`                                   | 当前只有浏览器安全的数据契约；后续承载业务与运行时 |
| `apps/cli/`、`packages/connectors/`、`skills/`     | 已划分职责，尚未实现                               |
| `docs/`、`tests/`                                  | 架构、开发和部署说明，以及契约和浏览器检查         |

目前由根 package 管理前端依赖，预留目录尚不是独立可安装的软件包。
新页面按[前端接入指南](docs/frontend.md)注册，不把所有功能堆在首页文件里。

## 公开部署与数据边界

GitHub Pages 只发布 `apps/admin/dist`，不运行 Node 服务、不访问本机文件。
主分支通过检查后自动部署，PR 只检查；具体步骤见[部署说明](docs/deployment.md)。

源代码使用 [MIT](LICENSE) 许可，免费开放。未来希望覆盖建站、接入统计、运营复查与
agent 协作。电脑离线时，本机不能接收全球访客事件，因此自有埋点仍需要网站已有后端
或可选接收端；第三方 API 与托管产生的费用另计。

提交前运行 `pnpm check:public` 并人工检查源码与构建产物，不提交密钥、真实账号、
私人数据、内部历史或生产截图。扫描只是辅助，不能替代安全评审。
贡献规则统一维护在 [AGENTS.md](AGENTS.md)，[CLAUDE.md](CLAUDE.md) 引用同一份规范。
