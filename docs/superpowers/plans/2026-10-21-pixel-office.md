# Pixel Office Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Một app desktop Electron dạng "pet" vẽ mỗi lần chạy `/reels-squad` thành một ngôi nhà pixel 8-bit ban đêm. Nhân vật cử động và nói bong bóng theo sự kiện hooks thật của Claude Code.

**Architecture:** Hook Node (`hook/hook.js`, async) rút gọn stdin của Claude Code thành sự kiện nhỏ rồi POST tới server HTTP `127.0.0.1:47821`. Server chạy trong tiến trình main của Electron (chạy được cả không cần Electron, để test). Server giữ danh sách nhà (`houses.js`), phục vụ trang renderer tĩnh và đẩy sự kiện qua SSE `/stream`. Renderer là trang web ES module: mỗi nhân vật có một "não" (máy trạng thái thuần), cảnh vẽ vào bộ đệm pixel 128×224 port từ bản phác thảo, bong bóng là DOM phủ lên trên.

**Tech Stack:** Node 24 (đã có), Electron (bản ổn định mới nhất), `node:test` cho test (không thêm framework test), `@fontsource/vt323` cho font, Playwright có sẵn tại `E:\aff\reels\tools\node_modules` để chụp màn hình kiểm tra.

**Spec:** `E:\aff\pixel-office\docs\superpowers\specs\2026-10-21-pixel-office-design.md`
**Tham chiếu hình ảnh:** `E:\aff\pixel-office\.superpowers\brainstorm\1438-1792555239\content\cast-cozy-v4.html`: port thuật toán vẽ, bảng màu, sprite, ánh sáng, bong bóng **từ file này**.

## Global Constraints

- Canvas logic **128×224**, phóng nguyên lần ×2 (mặc định) hoặc ×3, `image-rendering: pixelated`. Vẽ cả trời đêm lẫn ngôi nhà, cửa sổ `frame:false`, `transparent:true` (chỉ để bo góc), `alwaysOnTop:true`.
- Server chỉ bind `127.0.0.1`, cổng **47821**.
- Hook: `"async": true`, POST timeout **300 ms**, mọi lỗi → `exit 0`, không in gì ra stdout.
- Không gửi nội dung lệnh, file hay tin nhắn. Chỉ gửi loại tool, vai người nhận, và `head` = dòng đầu khớp `TASK <id>` hoặc `[DONE|BLOCKED|FAIL] …`, cắt **60** ký tự.
- `~/.claude/settings.json`: chỉ **thêm** mục, không sửa hay xoá hook AgentPet/Orca. Sao lưu `settings.json.bak-pixel-office` trước khi ghi. Chạy lại không nhân đôi.
- Animation **6 khung/giây**. Font **VT323** nhúng cục bộ. Chữ trắng và vàng `#ffd84a`, bóng `#1a1033`.
- Vai: `manager | researcher | prompt | coder | styler` ↔ nhân vật `Sếp Bơ | Na | Mây | Tí | Hồng`.
- Bong bóng: tối đa **2** cùng lúc (không tính chờ bạn), hiện **2800 ms** (chờ bạn **4000 ms**, lặp lại), câu ≤ **24** ký tự, không lặp câu vừa nói, không đè nhau, không tràn khung.
- Trạng thái: không có sự kiện **5000 ms** → về `work`. Nghỉ quá **180000 ms** → `sleep`. Lỗi → `confused` **3000 ms**. Nhà kết thúc → xoá sau **600000 ms**.
- Thư mục squad: `%LOCALAPPDATA%\PixelOffice\squads\<squadId>.json`. Biến môi trường: `PIXEL_OFFICE_SQUAD`, `PIXEL_OFFICE_ROLE`, `PIXEL_OFFICE_HOME` (mặc định `E:\aff\pixel-office`).

## Review Focus

- **App chưa chạy khi hook bắn:** hook phải thoát trong < 1 s, exit 0, không treo Claude Code. Test ở Task 2.
- **stdin hỏng hoặc rỗng, hoặc trường lạ** (tool mới, `tool_input` thiếu): hook bỏ qua êm, renderer không văng. Test ở Task 1 và Task 5.
- **Sự kiện dồn dập trong lúc đang đi đưa tin** (10 PreToolUse trong 1 s): nhân vật đi hết đường rồi mới nhận trạng thái mới nhất, không giật qua lại. Test ở Task 5.
- **Hai squad cùng manager, hoặc `-Only coder`:** `-Only` ghép vào nhà cũ, launch đầy đủ thay nhà cũ. Test ở Task 3.
- **settings.json có sẵn hook khác / chạy setup 2 lần:** giữ nguyên mục cũ, không nhân đôi. Test ở Task 9.

---

## File Structure

```
pixel-office/
  package.json, .gitignore
  src/shared/protocol.js     ROLES, CHAR_NAMES, EVENT_KINDS, toolCategory(), extractHead(), roleFromSessionName()
  hook/condense.js           condense(input, ctx) -> Event | null   (thuần)
  hook/squads.js             đọc/ghi file squad (thư mục truyền vào được để test)
  hook/post.js               post(ev, {port,timeoutMs}) -> Promise<boolean>; ensureApp()
  hook/hook.js               điểm vào hook: stdin -> condense -> post; luôn exit 0
  hook/notify.js             CLI cho launch.ps1: squad-start
  src/main/houses.js         createRegistry() -> {apply(ev, now), list(now)}   (thuần)
  src/main/server.js         startServer({port, staticDir, registry}) -> {close()}
  src/main/server-cli.js     chạy server không cần Electron (preview/test)
  src/main/main.js           Electron: cửa sổ, khay, single instance, nhớ vị trí
  src/renderer/index.html, style.css, app.js
  src/renderer/brain.js      createBrain(role, opts) (thuần)
  src/renderer/scene/gfx.js, world.js, sprites.js, props.js, light.js, paths.js, draw.js
  src/renderer/bubbles.js    createBubbleScheduler(), pickLine(), resolveOverlap() (thuần) + mountBubbles()
  src/renderer/lines.json
  scripts/setup.js           mergeHooks(settings, cmd) + CLI
  scripts/demo.js            phát kịch bản giả
  test/*.test.js
```

Mẫu sự kiện (Event), dùng ở mọi nơi:
```js
{ squad: 'sq-20261021153000', role: 'coder', kind: 'tool', cat: 'render', to: null, head: null, session: '<session_id>', ts: 1729500000000 }
// kind ∈ squad_start | manager_join | session_start | prompt | tool | send | wait | stop | fail | session_end
// cat (khi kind='tool') ∈ edit | bash | render | read | browse | agent | other
// send: to = role người nhận, head = dòng đầu đã lọc hoặc null
// squad_start: thêm managerName, replace (true khi launch đầy đủ)
```

---

### Task 1: Khung dự án + protocol + condense

**Files:**
- Create: `package.json`, `.gitignore`, `src/shared/protocol.js`, `hook/condense.js`
- Test: `test/protocol.test.js`, `test/condense.test.js`

**Interfaces:**
- Produces: `ROLES`, `CHAR_NAMES` (`{manager:'Sếp Bơ',researcher:'Na',prompt:'Mây',coder:'Tí',styler:'Hồng'}`), `toolCategory(toolName, toolInput) -> cat`, `extractHead(message) -> string|null`, `roleFromSessionName(name, managerName) -> role|null`, `condense(input, {squad, role, managerName, now}) -> Event|null`.

- [ ] **Step 1:** `git init` trong `E:\aff\pixel-office`. `.gitignore`: `node_modules/`, `.superpowers/`, `dist/`. `package.json`: `"type":"module"`, scripts `test: node --test test/`, `start: electron .`, `preview: node src/main/server-cli.js`, `demo: node scripts/demo.js`, `setup: node scripts/setup.js`, `main: src/main/main.js`. `npm i -D electron`, `npm i @fontsource/vt323`.
- [ ] **Step 2: Viết test thất bại**
```js
test('toolCategory', () => {
  assert.equal(toolCategory('Edit', {}), 'edit'); assert.equal(toolCategory('Write', {}), 'edit');
  assert.equal(toolCategory('Bash', {command:'node render.mjs out'}), 'render');
  assert.equal(toolCategory('PowerShell', {command:'ffmpeg -i a.mp4'}), 'render');
  assert.equal(toolCategory('Bash', {command:'ls'}), 'bash');
  assert.equal(toolCategory('Grep', {}), 'read'); assert.equal(toolCategory('WebSearch', {}), 'read');
  assert.equal(toolCategory('mcp__claude-in-chrome__navigate', {}), 'browse');
  assert.equal(toolCategory('Agent', {}), 'agent'); assert.equal(toolCategory('Task', {}), 'agent');
  assert.equal(toolCategory('Weird', undefined), 'other');
});
test('extractHead', () => {
  assert.equal(extractHead('TASK C1: dựng video abc\nchi tiết...'), 'TASK C1: dựng video abc');
  assert.equal(extractHead('[BLOCKED] coder TASK C1 — thiếu file'), '[BLOCKED] coder TASK C1 — thiếu file');
  assert.equal(extractHead('xin chào, nội dung riêng tư'), null);
  assert.equal(extractHead('TASK ' + 'x'.repeat(100)).length, 60);
  assert.equal(extractHead(undefined), null);
});
test('roleFromSessionName', () => {
  assert.equal(roleFromSessionName('reels-coder', 'mgr-1'), 'coder');
  assert.equal(roleFromSessionName('mgr-1', 'mgr-1'), 'manager');
  assert.equal(roleFromSessionName('someone', 'mgr-1'), null);
});
test('condense', () => {
  const ctx = {squad:'sq-1', role:'coder', managerName:'mgr-1', now:5};
  assert.deepEqual(condense({hook_event_name:'PreToolUse', session_id:'s', tool_name:'Edit', tool_input:{file_path:'secret.txt'}}, ctx),
    {squad:'sq-1', role:'coder', kind:'tool', cat:'edit', to:null, head:null, session:'s', ts:5});
  const send = condense({hook_event_name:'PreToolUse', session_id:'s', tool_name:'SendMessage', tool_input:{to:'mgr-1', message:'[DONE] coder TASK C1 — ok\nbody'}}, ctx);
  assert.equal(send.kind,'send'); assert.equal(send.to,'manager'); assert.equal(send.head,'[DONE] coder TASK C1 — ok');
  assert.ok(!JSON.stringify(send).includes('body'));
  assert.equal(condense({hook_event_name:'Notification', notification_type:'permission_prompt'}, ctx).kind, 'wait');
  assert.equal(condense({hook_event_name:'Notification', notification_type:'auth_success'}, ctx), null);
  assert.equal(condense({hook_event_name:'PermissionRequest'}, ctx).kind, 'wait');
  for (const [e,k] of [['SessionStart','session_start'],['UserPromptSubmit','prompt'],['Stop','stop'],['StopFailure','fail'],['PostToolUseFailure','fail'],['SessionEnd','session_end']])
    assert.equal(condense({hook_event_name:e}, ctx).kind, k);
  assert.equal(condense({hook_event_name:'PostToolUse', tool_name:'Edit'}, ctx), null);
  assert.equal(condense(null, ctx), null); assert.equal(condense({hook_event_name:'Nope'}, ctx), null);
  assert.equal(condense({hook_event_name:'Stop'}, {...ctx, squad:null}), null);
});
```
- [ ] **Step 3:** Chạy `npm test`. Mong đợi: FAIL (chưa có module).
- [ ] **Step 4:** Viết `protocol.js` và `condense.js`. `SendMessage` với `to` không ánh xạ được vai → `to:null`. Notification `wait` với `notification_type` ∈ `permission_prompt|idle_prompt|agent_needs_input|elicitation_dialog`. `head` chỉ cho kind `send`.
- [ ] **Step 5:** `npm test` → PASS. Commit `feat: protocol + condense`.

### Task 2: Hook runtime + squad files + notify

**Files:**
- Create: `hook/squads.js`, `hook/post.js`, `hook/hook.js`, `hook/notify.js`
- Test: `test/hook.test.js`

**Interfaces:**
- Consumes: `condense`, `roleFromSessionName`.
- Produces:
  - `squadsDir()`: `process.env.PIXEL_OFFICE_SQUADS_DIR || %LOCALAPPDATA%\PixelOffice\squads`.
  - `writeSquad(dir, {squad, managerName, managerSession:null, createdAt})`, `readSquads(dir) -> []`, `findByManagerSession(dir, sid)`, `claimNewest(dir, sid, now, maxAgeMs=120000) -> squad|null` (gán `managerSession` cho file mới nhất chưa có chủ).
  - `post(ev, {port=47821, timeoutMs=300}) -> Promise<boolean>`.
  - `ensureApp()`: spawn `npx electron <PIXEL_OFFICE_HOME>` (hoặc `node_modules/.bin/electron.cmd`) với `detached:true, stdio:'ignore', windowsHide:true`, rồi `unref()`.
  - `hook.js` chạy: đọc stdin → xác định ngữ cảnh → `condense` → `post`.
  - CLI: `node hook/notify.js squad-start --squad <id> --manager <name> [--replace]` → POST `squad_start`. Nếu thất bại thì `ensureApp()`, thử lại tối đa 10 lần, mỗi lần cách 500 ms. Luôn exit 0.

Logic ngữ cảnh trong `hook.js`:
1. Có `PIXEL_OFFICE_SQUAD` + `PIXEL_OFFICE_ROLE` → phiên con, lấy `managerName` từ file squad.
2. Không có env: nếu `PostToolUse` + tool Bash/PowerShell + `command` chứa `launch.ps1` → `claimNewest`, gửi `manager_join` (kind riêng, `role:'manager'`).
3. Không có env: `findByManagerSession(session_id)` → ngữ cảnh manager. Không thấy → thoát.
4. Nếu file `<squadsDir>/../debug` tồn tại thì append stdin thô vào `<squadsDir>/../hook-debug.log` (để kiểm dạng `SendMessage` ở Task 10).

- [ ] **Step 1: Viết test thất bại**
```js
test('hook exits 0 fast when app is down', async () => {
  const t0 = Date.now();
  const r = spawnSync('node', ['hook/hook.js'], { input: JSON.stringify({hook_event_name:'Stop', session_id:'s'}),
    env: {...process.env, PIXEL_OFFICE_SQUAD:'sq-1', PIXEL_OFFICE_ROLE:'coder', PIXEL_OFFICE_SQUADS_DIR: tmp, PIXEL_OFFICE_PORT:'1'} });
  assert.equal(r.status, 0); assert.equal(r.stdout.length, 0); assert.ok(Date.now() - t0 < 1000);
});
test('hook exits 0 on garbage stdin', () => { assert.equal(spawnSync('node',['hook/hook.js'],{input:'{not json'}).status, 0); });
test('hook posts condensed event', async () => { /* server giả trên cổng ngẫu nhiên, PIXEL_OFFICE_PORT=<cổng>; nhận đúng 1 body có kind 'stop', role 'coder' */ });
test('manager joins via launch.ps1 then is recognised', async () => {
  writeSquad(tmp, {squad:'sq-9', managerName:'mgr', managerSession:null, createdAt:Date.now()});
  // PostToolUse Bash command '... reels-squad\\scripts\\launch.ps1 -Manager mgr' session 'M' -> server nhận kind 'manager_join', squad 'sq-9'
  // tiếp theo Stop session 'M' (không env) -> nhận kind 'stop', role 'manager'
});
test('unknown session is ignored', () => { /* Stop session 'X' không env -> server không nhận gì */ });
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Viết 4 file. Cổng đọc từ `PIXEL_OFFICE_PORT` (mặc định 47821). Bọc toàn bộ `hook.js` trong try/catch, đặt `setTimeout(() => process.exit(0), 800).unref()` làm chốt an toàn.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: hook runtime`.

### Task 3: Danh sách nhà + server

**Files:**
- Create: `src/main/houses.js`, `src/main/server.js`, `src/main/server-cli.js`
- Test: `test/houses.test.js`, `test/server.test.js`

**Interfaces:**
- Produces:
  - `createRegistry() -> { apply(ev, now) -> boolean /*có thay đổi*/, list(now) -> House[] }`.
  - `House = { id, managerName, createdAt, endedAt|null, members: { [role]: { present:boolean, session:string|null } } }`, `list` sắp mới nhất trước và bỏ nhà có `endedAt` cũ hơn 600000 ms.
  - `startServer({port=47821, host='127.0.0.1', staticDir, registry}) -> Promise<{port, close()}>`. Các route: `POST /event` (JSON ≤ 4 KB, sai thì 400) → `registry.apply` → phát SSE `{type:'event', ev, houses}`. `GET /stream`: SSE, gửi ngay `{type:'state', houses}`. `GET /health` → `ok`. `GET /fonts/*` phục vụ từ `node_modules/@fontsource/vt323/files`. `GET /*` phục vụ `staticDir` (chặn `..`).
  - `server-cli.js`: chạy `startServer` với `staticDir=src/renderer`, in URL.

- [ ] **Step 1: Viết test thất bại**
```js
test('squad_start creates house with manager present', ...);   // members.manager.present === true
test('session_start marks member present, session_end absent', ...);
test('manager_join sets members.manager.session', ...);
test('event for unknown squad is ignored', ...);                // apply trả false
test('-Only relaunch: squad_start same id without replace keeps house', ...);
test('full relaunch: squad_start replace=true with new id ends older house of same managerName', ...);
test('house ends when all 4 children ended', ...);              // endedAt set
test('house ends when manager session_end', ...);
test('ended house disappears after 600000 ms', ...);
test('server: POST /event then GET /stream receives it; bad JSON -> 400; /health ok; path traversal -> 404', ...);
```
- [ ] **Step 2:** FAIL → **Step 3:** viết code → **Step 4:** PASS. Commit `feat: house registry + local server`.

### Task 4: Vỏ Electron

**Files:**
- Create: `src/main/main.js`, `assets/icon.png` (32×32, hình ngôi nhà pixel, có thể sinh bằng script nhỏ)

**Interfaces:**
- Consumes: `createRegistry`, `startServer`.
- Produces: cửa sổ load `http://127.0.0.1:47821/?scale=<n>`.

Yêu cầu: `app.requestSingleInstanceLock()` (phiên thứ 2 thì thoát, phiên đầu hiện cửa sổ). `BrowserWindow({width:128*scale, height:224*scale, frame:false, transparent:true, alwaysOnTop:true, resizable:false, hasShadow:false, backgroundColor:'#00000000'})`. Nhớ `{x,y,scale}` ở `app.getPath('userData')/window.json`, lưu khi `moved`. Khay hệ thống: Hiện/Ẩn, Phóng ×2, Phóng ×3, Thoát. Đổi scale thì đổi kích thước và reload. Nếu cổng 47821 đang bận thì báo bằng dialog rồi thoát.

- [ ] **Step 1:** Viết `main.js`.
- [ ] **Step 2:** Tạm thời dùng `src/renderer/index.html` giữ chỗ (nền tím `#0e0b2e`, chữ "PIXEL OFFICE"). Chạy `npm start`. Mong đợi: cửa sổ 256×448 bo góc, không viền, nổi trên cùng. Chạy `npm start` lần 2 → không mở cửa sổ thứ hai. Kéo cửa sổ, tắt, mở lại → về đúng chỗ cũ.
- [ ] **Step 3:** Commit `feat: electron shell`.

### Task 5: Não nhân vật

**Files:**
- Create: `src/renderer/brain.js`
- Test: `test/brain.test.js`

**Interfaces:**
- Produces: `createBrain(role, { walkMs:(toRole)=>number }) -> { handle(ev, now), tick(now) -> {action, since, data} }`.
- `action ∈ absent | enter | work | type_fast | render | read | browse | phone | walk | alert | rest | sleep | confused | leave`.
- Ánh xạ: `session_start`→`enter` (1500 ms) rồi `rest`. `prompt`→`work`. `tool` cat `edit`→`work`, `bash`→`type_fast`, `render`→`render`, `read`→`read`, `browse`→`browse`, `agent`→`phone`, `other`→`work`. `send`→`walk` `{to, head}` khoá `walkMs(to)` ms. `wait`→`alert` (tới khi có sự kiện khác). `stop`→`rest`. `fail`→`confused` 3000 ms rồi về trạng thái trước. `session_end`→`leave` (2000 ms) rồi `absent`. Các trạng thái từ tool tự về `work` sau 5000 ms không có sự kiện. `rest` > 180000 ms thì `sleep`.

- [ ] **Step 1: Viết test thất bại**
```js
test('tool events map to actions', ...);
test('tool action falls back to work after 5000ms', () => { b.handle({kind:'tool',cat:'render'},0); assert.equal(b.tick(4999).action,'render'); assert.equal(b.tick(5000).action,'work'); });
test('rest becomes sleep after 180000ms', ...);
test('walk is not interrupted; latest queued event applies after', () => {
  const b = createBrain('coder',{walkMs:()=>3000}); b.handle({kind:'send',to:'manager'},0);
  for (let i=0;i<10;i++) b.handle({kind:'tool',cat:i%2?'read':'edit'}, 100+i*50);
  b.handle({kind:'stop'}, 900);
  assert.equal(b.tick(2999).action,'walk'); assert.equal(b.tick(3000).action,'rest');
});
test('wait shows alert until next event', ...);
test('fail -> confused 3000ms then previous action', ...);
test('session_end -> leave -> absent; session_start -> enter -> rest', ...);
test('unknown kind is ignored', ...);
```
- [ ] **Step 2:** FAIL → **Step 3:** viết code → **Step 4:** PASS. Commit `feat: character brain`.

### Task 6: Cảnh pixel

**Files:**
- Create: `src/renderer/scene/gfx.js`, `world.js`, `sprites.js`, `props.js`, `light.js`, `paths.js`, `draw.js`
- Test: `test/paths.test.js`

**Interfaces:**
- Produces:
  - `paths.js`: `STATIONS = { manager:{floor:2,sx:30}, prompt:{floor:2,sx:94}, researcher:{floor:1,sx:20}, coder:{floor:1,sx:62}, styler:{floor:1,sx:106} }` (giống bản phác thảo). `walkPath(from, to) -> [{x,y}]` đi trên mặt sàn. Khác tầng thì đi qua **cầu thang** ở mép phải nhà (x≈118–124) nối sàn tầng 1 (y 208) với sàn tầng 2 (y 124). `pointAt(path, p) -> {x,y,dir}`. `walkMs(from,to)` = độ dài đường × 2 (đi tới rồi về) / **24 px/s**.
  - `draw.js`: `createScene(canvas) -> { render(chars, f, t) -> anchors }`, với `chars = { [role]: {action, since, data} }` và `anchors = { [role]: [x,y] | null }` (toạ độ logic trên đỉnh đầu).
- Port nguyên cách vẽ từ `cast-cozy-v4.html`: bộ đệm `ImageData`, mặt nạ phát sáng, lớp sprite có viền màu tối hơn (`dk(c,.42)`), dither Bayer, trời/sao/trăng/sao băng, mái/ống khói/mèo/ăng-ten, 2 tầng, trang trí, đèn treo, ánh sáng theo bậc. Tách module theo danh sách file, giữ đúng màu.
- Thêm so với bản phác thảo: **cầu thang** (gỗ `#7a4a32`, bậc 2 px, có tay vịn); `read` (Na giơ kính lúp, người khác ngó màn hình); `browse` (màn hình chiếu cảnh, chống cằm); `render` (máy bốc khói xám 3 hạt, tay quạt); `phone` (cầm ống nghe máy bàn); `confused` (mây đen 5×3 trên đầu + gãi đầu); `sleep` (gục bàn, "z" bay lên, như Mây nghỉ); `enter`/`leave` (đi từ cầu thang tới ghế hoặc ngược lại); `absent` (bàn trống, ghế lệch). `type_fast` = `work` với tốc độ tay gấp đôi. `walk` theo `walkPath` đi rồi về, cầm phong bì (đỏ `#d84a4a` nếu `head` bắt đầu bằng `[BLOCKED` hoặc `[FAIL`). Nhà đã kết thúc: đèn tắt dần (giảm cường độ ánh sáng trong 3 s).

- [ ] **Step 1: Viết test thất bại**
```js
test('same floor path stays on floor y', () => { const p=walkPath('researcher','styler'); assert.ok(p.every(q=>q.y===p[0].y)); });
test('cross floor path uses stairs', () => { const p=walkPath('coder','manager'); assert.ok(p.some(q=>q.x>=118)); assert.equal(p[0].y>p.at(-1).y, true); });
test('pointAt endpoints', () => { const p=walkPath('coder','manager'); assert.deepEqual(pick(pointAt(p,0)), pick(p[0])); assert.deepEqual(pick(pointAt(p,1)), pick(p.at(-1))); });
test('walkMs positive and longer across floors', () => { assert.ok(walkMs('coder','manager') > walkMs('coder','styler')); });
```
- [ ] **Step 2:** FAIL → **Step 3:** viết `paths.js` → **Step 4:** PASS.
- [ ] **Step 5:** Port các module vẽ còn lại. Tạm nối `app.js` vẽ cảnh tĩnh với 5 nhân vật ở 5 action khác nhau theo `?debug=all` (mỗi người lần lượt chạy qua mọi action, 3 s một action).
- [ ] **Step 6:** Kiểm hình: `npm run preview` (nền), chụp `http://127.0.0.1:47821/?debug=all&scale=3` bằng Playwright (`createRequire('E:/aff/reels/tools/package.json')`) ở 6 thời điểm cách nhau 3 s, xem từng ảnh. Đạt khi: giống bản phác thảo (trời dither, mèo, đèn vàng, viền màu), thấy cầu thang, mọi action nhìn ra được, không lỗi console.
- [ ] **Step 7:** Commit `feat: pixel scene`.

### Task 7: Bong bóng thoại

**Files:**
- Create: `src/renderer/bubbles.js`, `src/renderer/lines.json`
- Test: `test/bubbles.test.js`

**Interfaces:**
- Produces:
  - `lines.json`: `{ [role]: { work:[], type_fast:[], render:[], read:[], browse:[], phone:[], walk:[], alert:[], rest:[], sleep:[], confused:[] } }`. Mỗi ô ≥ 4 câu tiếng Việt, ≤ 24 ký tự, đúng tính cách (Spec → Dàn nhân vật). Lấy câu trong bản phác thảo làm điểm bắt đầu. Câu `walk` có thể dùng `{to}` (tên nhân vật người nhận) và `{task}` (vd `C1`, chỉ dùng khi `head` có TASK).
  - `pickLine(lines, role, action, ctx:{to,task}, last, rand) -> {text, kind:'say'|'think'|'alert'}`. `think` khi action ∈ `rest|sleep|read` hoặc câu kết thúc bằng `...`. Không trả lại `last` nếu ô có > 1 câu. Câu có `{task}` mà không có task thì bỏ qua câu đó.
  - `createBubbleScheduler({rand, now}) -> { tick(now, chars) -> Bubble[] }`, `Bubble = {role, text, kind, until}`. Mỗi 1200–2700 ms chọn 1 nhân vật không `absent`. Tối đa 2 bong bóng không phải alert. Nhân vật `alert` luôn có bong bóng alert (lặp mỗi 4000 ms).
  - `resolveOverlap(rects, bounds) -> rects`: dời rect sau lên trên tới khi hết chồng, rồi kẹp trong `bounds`.
  - `mountBubbles(container, scaleFn) -> { update(bubbles, anchors) }`: DOM. CSS port từ bản phác thảo (`.cz-bub`, `.alert`, `.think`, `pop`).

- [ ] **Step 1: Viết test thất bại**
```js
test('lines.json: every role x action has >=4 lines <=24 chars', ...);
test('pickLine never repeats last', ...);
test('pickLine kinds: rest->think, alert->alert, work->say', ...);
test('walk line fills {to}; skips {task} lines when no task', ...);
test('scheduler: at most 2 non-alert bubbles, alert chars always have one', ...);
test('scheduler: absent chars never speak', ...);
test('resolveOverlap: no two rects intersect, all inside bounds', ...);
```
- [ ] **Step 2:** FAIL → **Step 3:** viết code → **Step 4:** PASS. Commit `feat: 8-bit speech bubbles`.

### Task 8: Ghép renderer + bảng tin + chuyển nhà + demo

**Files:**
- Create/Modify: `src/renderer/index.html`, `style.css`, `app.js`, `scripts/demo.js`

**Interfaces:**
- Consumes: `createBrain`, `walkMs`, `createScene`, `createBubbleScheduler`, `mountBubbles`, SSE `/stream`.
- Hành vi:
  - `@font-face` VT323 từ `/fonts/vt323-vietnamese-400-normal.woff2` và `/fonts/vt323-latin-400-normal.woff2` (kiểm tên file thật trong gói).
  - Chữ phủ trên trời như bản phác thảo: "REELS SQUAD" / tên kênh hoặc "5 AGENT" / trạng thái ngắn ("ĐANG LÀM VIỆC", "CHỜ BẠN!" khi có người `alert`, "NGHỈ NGƠI" khi tất cả `rest|sleep`).
  - Bảng tin dưới cùng: `head` của sự kiện `send` gần nhất dạng `<Người gửi> → <Người nhận> · <head>`, không có thì `<Tên> đang <việc>`.
  - Thanh kéo: dải trong suốt cao 12 px ở đỉnh (`-webkit-app-region: drag`), hiện mũi tên ◀ ▶ (no-drag) khi có > 1 nhà. Không có nhà nào: trời và nhà tối, chữ "CHƯA CÓ SQUAD".
  - Vòng lặp: `requestAnimationFrame`, chỉ vẽ lại khi `f = floor(t*6)` đổi. Mỗi khung: `brain.tick` → `scene.render` → `scheduler.tick` → `bubbles.update(anchors)`.
  - `?debug=all` của Task 6 vẫn giữ.
  - `scripts/demo.js`: POST lần lượt một kịch bản khoảng 60 s: squad_start → 4 session_start → manager send TASK R1 → researcher browse/read/bash → send [DONE] → manager send TASK P1 → prompt read/edit → coder render → styler edit → coder fail → manager wait → stop toàn bộ. Tham số `--loop`.
- [ ] **Step 1:** Viết code.
- [ ] **Step 2:** Kiểm: `npm run preview` + `npm run demo`, chụp Playwright 8 ảnh cách nhau 7 s. Đạt khi: nhân vật đổi đúng action theo kịch bản, phong bì đi qua cầu thang khi manager gửi cho tầng dưới, bong bóng không đè nhau, bảng tin cập nhật, không lỗi console.
- [ ] **Step 3:** Kiểm trong Electron: `npm start` + `npm run demo`. Nhìn thấy giống hệt.
- [ ] **Step 4:** Commit `feat: renderer wiring + demo`.

### Task 9: Cài hook + sửa skill reels-squad

**Files:**
- Create: `scripts/setup.js`
- Modify: `C:\Users\PC\.claude\skills\reels-squad\scripts\launch.ps1`, `child.ps1` (repo git riêng)
- Test: `test/setup.test.js`

**Interfaces:**
- Produces: `mergeHooks(settings, command) -> settings` (thuần). Thêm vào mỗi event `SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest, Notification, Stop, StopFailure` một nhóm `{ matcher:'*' (chỉ cho event tool), hooks:[{type:'command', command, async:true, timeout:5}] }`. Lệnh: `node "E:/aff/pixel-office/hook/hook.js"`. Nhận diện mục của mình bằng chuỗi `pixel-office/hook/hook.js`.
- CLI `npm run setup`: đọc `~/.claude/settings.json`, sao lưu `settings.json.bak-pixel-office` (chỉ khi chưa có), ghi JSON thụt 2 dấu cách. `--uninstall` gỡ đúng mục của mình.

- [ ] **Step 1: Viết test thất bại**
```js
test('mergeHooks keeps existing AgentPet/Orca entries untouched', ...);  // deepEqual các nhóm cũ
test('mergeHooks is idempotent', () => { const a=mergeHooks(s,cmd); assert.deepEqual(mergeHooks(a,cmd), a); });
test('mergeHooks adds async:true for all 10 events', ...);
test('uninstall removes only pixel-office entries', ...);
```
- [ ] **Step 2:** FAIL → **Step 3:** viết code → **Step 4:** PASS.
- [ ] **Step 5: Sửa `launch.ps1`** (giữ ASCII): thêm tham số `[string]$SquadId=''`. Thư mục squad `"$env:LOCALAPPDATA\PixelOffice\squads"`. Khi `$Only` rỗng: sinh `sq-` + `Get-Date -Format yyyyMMddHHmmss`, ghi `<id>.json` `{squad, managerName, managerSession:null, createdAt}` (ms epoch), `replace=$true`. Khi có `$Only`: lấy file mới nhất có `managerName -eq $Manager`, không có thì sinh mới. Nếu `$env:PIXEL_OFFICE_HOME` (mặc định `E:\aff\pixel-office`) có `hook\notify.js`: chạy `node notify.js squad-start --squad <id> --manager <name> [--replace]` bằng `Start-Process -WindowStyle Hidden` (không chờ). Truyền `-SquadId <id>` vào lệnh `child.ps1` trong `PaneCmd`. Bọc phần Pixel Office trong try/catch: lỗi thì in cảnh báo, launch vẫn chạy tiếp.
- [ ] **Step 6: Sửa `child.ps1`:** thêm `[string]$SquadId=''`. Nếu có thì `$env:PIXEL_OFFICE_SQUAD=$SquadId; $env:PIXEL_OFFICE_ROLE=$Role` trước `& claude`.
- [ ] **Step 7:** Kiểm: `launch.ps1 -Manager test -DryRun` in lệnh có `-SquadId sq-…`, và file squad được tạo. Xoá file thử.
- [ ] **Step 8:** Chạy `npm run setup`. Kiểm `settings.json` còn nguyên hook AgentPet/Orca, có thêm 10 mục mới. Commit trong pixel-office: `feat: hook installer`. Commit trong repo skill: `feat: pixel office squad ids`.

### Task 10: Kiểm thử đầu-cuối với Claude Code thật

- [ ] **Step 1:** Tạo file `%LOCALAPPDATA%\PixelOffice\debug`. Mở app (`npm start`).
- [ ] **Step 2:** Giả lập 1 phiên con: trong PowerShell đặt `$env:PIXEL_OFFICE_SQUAD`, `$env:PIXEL_OFFICE_ROLE='coder'` cùng một file squad thử, rồi chạy `claude -p "list files in this folder" --permission-mode bypassPermissions`. Mong đợi: Tí chuyển sang `read`/`type_fast` rồi `rest`. `hook-debug.log` có `SessionStart` kèm `session_title` hoặc không, ghi lại kết quả.
- [ ] **Step 3:** Kiểm `SendMessage`: trong một phiên reels-squad thật (hoặc nhờ người dùng chạy `/reels-squad`), xem `hook-debug.log` có `PreToolUse` `tool_name:"SendMessage"` với `tool_input.to` và `message`. Nếu tên tool hoặc trường khác thì sửa `condense` và test Task 1 cho khớp.
- [ ] **Step 4:** Xoá file `debug` và log. Đo: một phiên Claude Code với hook không chậm đi thấy được (hook async).
- [ ] **Step 5:** Commit các chỉnh sửa (nếu có): `fix: align with real hook payloads`.
