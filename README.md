# 中式外卖点餐系统（本地版）

这是一个简单的静态网站示例，实现了中式菜单点餐、在浏览器本地保存订单、编辑购物车并确认下单。

文件列表：
- `index.html` — 页面主入口
- `styles.css` — 样式
- `app.js` — 交互逻辑（使用 `localStorage` 持久化订单）

快速开始：
1. 在本地打开 `index.html`（双击或在浏览器中打开）。
2. 点击菜品卡片上的 `+` / `-` 或 `加入` 按钮添加到购物车。购物车会保存在浏览器本地（`localStorage`）。
3. 在购物车里可以调整数量或删除项。点击 `确认下单` 会弹出预览，确认后会把订单保存为历史快照并清空当前购物车。

 
新功能：
- 增强的页面样式与图片展示（`images/` 中的 SVG 占位图）。
- 新增 `cart.html` 页面：在独立页面查看并编辑购物车（支持数量修改、删除、确认提交）。

如需启动：
```bash
open "/Users/xuyuwen/Documents/07 Cursor/OrderSystem/index.html"
```

可选：用 AI 生成真实菜品图像
-------------------------------------------------
如果你想把 SVG 占位图替换为 AI 生成的真实照片，可以用仓库中提供的 `fetch_ai_images.js` 脚本（需要你提供一个图像生成 API 的密钥，例如 OpenAI）。

示例（Node >=18）：

```bash
export OPENAI_API_KEY="sk-..."
node fetch_ai_images.js
```

脚本运行后会把生成的图片保存到 `images/<id>.jpg`。页面会优先加载 `images/<id>.jpg`，若不存在则回退显示内置的 SVG 占位图。

注意：脚本是一个辅助模版，可能需要根据你所使用的图像 API（OpenAI、Stable Diffusion 云服务等）调整请求细节与响应解析代码。