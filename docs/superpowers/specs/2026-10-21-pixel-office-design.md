# Pixel Office — thiết kế

Ngày: 2026-10-21 · Trạng thái: chờ người dùng duyệt

## Ý định và lý do

Người dùng chạy skill `/reels-squad`: 1 phiên Claude Code làm **manager** cộng 4 phiên con (`reels-researcher`, `reels-prompt`, `reels-coder`, `reels-styler`) nằm chung một terminal, nhắn tin cho nhau bằng `SendMessage`. Nhìn vào các pane terminal thì khó biết ai đang làm gì, ai đang kẹt, ai đang chờ người dùng.

Pixel Office là một **app desktop dạng "pet"** chạy trên máy Windows của người dùng. Nó vẽ mỗi lần chạy reels-squad thành **một ngôi nhà pixel 8-bit**, mỗi agent là một nhân vật có tính cách riêng. Nhân vật cử động như người thật theo trạng thái thật của phiên Claude Code tương ứng: ngồi gõ máy, nghỉ ngơi, giơ tay khi chờ người dùng, cầm phong bì đi đưa tin khi có `SendMessage`. Chỉ cần liếc qua góc màn hình là biết cả nhóm đang thế nào. Đây là app cá nhân, vừa hữu ích vừa để vui.

Người dùng đã cài app **AgentPet** (`C:\Users\PC\AppData\Local\AgentPet\agentpet.exe`) chạy bằng hooks Claude Code. Pixel Office theo cùng tinh thần đó: cửa sổ nhỏ nổi trên màn hình, ăn dữ liệu từ hooks.

## Mục tiêu

1. Cửa sổ **không viền, luôn nổi trên cùng**, là một khung chữ nhật vẽ kín **cả trời đêm lẫn ngôi nhà** (người dùng chọn giữ trời), góc bo nhẹ, kéo đặt ở đâu cũng được (thường là góc màn hình). Mở lại thì nhớ vị trí cũ.
2. **Tự hiện** khi người dùng chạy `/reels-squad`. Không cần mở app bằng tay.
3. Mỗi lần chạy reels-squad = **một ngôi nhà**. Có 5 nhân vật: manager + 4 phiên con.
4. Nhân vật đổi hành động theo **sự kiện thật** từ hooks Claude Code (bảng ánh xạ ở dưới).
5. Khi một agent gửi `SendMessage` cho agent khác, nhân vật người gửi **cầm phong bì đi tới chỗ người nhận**.
6. Một **dải bảng tin** hiện việc gần nhất (vd `TASK C1 → TÍ`, `DONE · coder`).
7. Hoàn toàn trên máy: không dùng server ngoài, không gửi dữ liệu đi đâu.

## Không làm (ở bản này)

- Không xem trên điện thoại, không deploy web (người dùng đã bỏ ý định Render).
- Không theo dõi các phiên Claude Code thường (không phải reels-squad). Phiên không thuộc squad thì bỏ qua.
- Không điều khiển agent từ app (không gửi lệnh, không trả lời prompt). App chỉ để xem.
- Không âm thanh (lựa chọn của tôi, có thể thêm sau).

## Điều cấm (dù chạy được vẫn coi là hỏng)

- Hook làm chậm hoặc chặn Claude Code. Hook phải chạy nền (`"async": true`), app tắt thì hook im lặng bỏ qua, không lỗi, không treo.
- Làm hỏng hook có sẵn của AgentPet và Orca trong `~/.claude/settings.json`. Chỉ được **thêm** mục mới, không sửa hay xoá mục cũ.
- Nhìn không ra 8-bit, hoặc khác phong cách đã chọn (xem Phong cách).
- Cửa sổ to hơn cần thiết hoặc có viền/bóng thừa che thao tác.

## Phong cách hình ảnh (người dùng đã chọn)

Bám đúng bản phác thảo C, "Science in 8bit", lấy cảm hứng từ kênh Instagram `@science_in_8bit`. Bản tham chiếu chạy được nằm ở `E:\aff\pixel-office\.superpowers\brainstorm\1438-1792555239\content\cast-cozy-v3.html`. Người dùng đã xác nhận đây là bản tham chiếu ("cái refs từ kênh ig ấy").

- Ngôi nhà 2 tầng nhìn mặt cắt, ban đêm, khung dọc. Canvas logic **128×224 px**, phóng nguyên lần (×2 mặc định, cho chọn ×3), `image-rendering: pixelated`.
- Mái ngói đỏ, ống khói bốc khói, ăng-ten đèn đỏ nhấp nháy, **mèo** ngồi trên mái vẫy đuôi. Trời đêm chuyển màu dither Bayer 4×4 (chàm → tím → hồng ở chân trời), sao lấp lánh, trăng, thỉnh thoảng có sao băng.
- Tầng trên: Sếp Bơ (bảng PLAN sau lưng) và Mây (kệ sách), có cửa sổ nhìn ra trời. Tầng dưới: Na (màn hình Instagram), Tí (2 màn hình code), Hồng (giá vẽ low poly), poster, đồng hồ chạy, chậu cây.
- Ánh sáng: mỗi bàn một đèn treo hắt quầng sáng vàng, màn hình hắt màu, nền tối lại theo bậc có dither. Pixel phát sáng (sao, màn hình, bóng đèn, dấu "!") không bị làm tối.
- Nhân vật chibi khoảng 14×21 px, đầu tròn, mắt có điểm sáng, má hồng. Viền là màu tối hơn của chính vật (không viền đen thuần). Animation giật kiểu game cũ, 6 khung/giây.
- Chữ dùng font pixel có dấu tiếng Việt (**VT323**, nhúng sẵn trong app, không tải từ mạng). Chữ trắng và vàng `#ffd84a`, đổ bóng tím đậm.

### Bong bóng thoại 8-bit (người dùng yêu cầu)

Mỗi nhân vật thỉnh thoảng nói hoặc nghĩ một câu ngắn trong bong bóng 8-bit ngay trên đầu. Tham chiếu: `cast-cozy-v4.html` cùng thư mục.

- Kiểu bong bóng: nền kem `#fff8e8`, viền pixel tím đậm `#2a1a3a` với góc vát bậc thang, chữ VT323. **Nói** thì có đuôi nhọn chỉ xuống đầu. **Nghĩ/ngủ** (trạng thái nghỉ, hoặc câu kết thúc bằng "...") thì có 2 chấm tròn. **Chờ bạn** thì nền vàng `#ffd84a` và giữ lâu hơn.
- Nhịp: khoảng mỗi 1,2–2,7 giây chọn ngẫu nhiên một người để nói. Tối đa 2 bong bóng cùng lúc (không tính bong bóng chờ bạn). Mỗi câu hiện khoảng 2,8 giây (chờ bạn thì 4 giây và lặp lại cho tới khi hết chờ). Hiện lên bằng hiệu ứng "pop" 2 khung. Bong bóng không được tràn khỏi khung, và **không được đè lên nhau**: nếu chồng thì đẩy cái sau lên trên.
- Nội dung: **câu viết sẵn** theo từng nhân vật × trạng thái (làm việc / nghỉ / chờ bạn / đưa tin / đọc / render / lỗi), giọng tiếng Việt tự nhiên, hợp tính cách, mỗi câu ≤ 24 ký tự. Mỗi ô ít nhất 4 câu, không lặp lại câu vừa nói. Để trong một file dữ liệu riêng (`lines.json`) để người dùng tự sửa, tự thêm.
- Câu có thể chèn tên người nhận khi đưa tin (vd "Thư cho Tí đây!") và mã TASK lấy từ dòng đầu của SendMessage (vd "TASK C1 đây!"). Ngoài ra không lấy nội dung thật nào từ phiên (lựa chọn của tôi, để giữ riêng tư).

### Dàn nhân vật (tên và tính cách là lựa chọn của tôi, người dùng chưa phản đối)

| Vai trò (tên phiên) | Nhân vật | Ngoại hình | Làm việc | Nghỉ |
|---|---|---|---|---|
| manager | Sếp Bơ | vest navy, cà vạt đỏ | giấy tờ, bảng PLAN | ngả lưng nhâm nhi cà phê |
| `reels-researcher` | Thám tử Na | mũ thám tử, áo măng tô | màn hình Instagram đổi màu | lướt điện thoại |
| `reels-prompt` | Mây | tóc tím dài, áo len, bút chì vàng | viết sổ, có lúc ngẩng lên nghĩ (bong bóng suy nghĩ) | gục bàn ngủ "z z" |
| `reels-coder` | Tí | hoodie xanh, tai nghe đỏ, kính phản sáng | 2 màn hình chạy code, lắc đầu theo nhạc | chơi máy game cầm tay, nốt nhạc |
| `reels-styler` | Hồng | mũ nồi đỏ, tạp dề dính sơn | giá vẽ đổi màu, nhún nhảy | vươn vai |

## Kiến trúc

```
Phiên Claude Code ──hook (async)──► hook.js ──HTTP POST 127.0.0.1──► Pixel Office (Electron)
 (manager + 4 con)                   (node, nhanh, nuốt mọi lỗi)        ├─ main: server HTTP, quản lý "nhà", lưu vị trí cửa sổ
                                                                         └─ renderer: canvas vẽ cảnh, máy trạng thái nhân vật
```

- **App:** Electron (lựa chọn của tôi). Cửa sổ `frame:false, transparent:true` (chỉ để bo góc), alwaysOnTop:true, skipTaskbar:false, resizable:false`. Kéo cửa sổ bằng một thanh nhỏ ở đầu (vùng `-webkit-app-region: drag`). Có icon khay hệ thống: Hiện/Ẩn, Phóng to ×2/×3, Thoát.
- **Một phiên bản duy nhất** (`requestSingleInstanceLock`). Server nghe ở `127.0.0.1` cổng cố định **47821** (lựa chọn của tôi). Chỉ nhận kết nối từ máy.
- **hook.js**: script Node nhỏ, đọc JSON từ stdin, rút gọn thành sự kiện (chỉ giữ trường cần thiết, **không gửi nội dung lệnh, nội dung file hay nội dung tin nhắn**, chỉ gửi loại tool, tên người nhận và dòng đầu dạng `TASK <id>` hoặc `[DONE|BLOCKED|FAIL] ...` cắt tối đa 60 ký tự cho bảng tin), POST với timeout 300 ms, lỗi gì cũng `exit 0`.
- **Tự khởi động:** khi hook thấy phiên manager bắt đầu một squad (xem Nhận diện) mà POST thất bại vì app chưa chạy, hook bật app ở chế độ tách rời (`detached`, `unref`) rồi gửi lại một lần.

### Nhận diện ai là ai

- **Phiên con:** `SessionStart` có `session_title` = `reels-researcher|prompt|coder|styler` (do `child.ps1` chạy `claude -n reels-<role>`). Thêm vào đó, `child.ps1` sẽ đặt biến môi trường `PIXEL_OFFICE_SQUAD=<id squad>` trước khi gọi `claude`. Hook kế thừa biến này, nên mọi sự kiện của phiên con đều biết thuộc nhà nào.
- **Manager:** phiên có `PreToolUse` mà lệnh Bash/PowerShell chứa `reels-squad\scripts\launch.ps1` (hoặc `/`). Lúc đó hook tạo `squadId` mới, đăng ký `session_id` này làm manager, và truyền `squadId` cho `launch.ps1` (sửa `launch.ps1`: nhận `-SquadId` hoặc tự sinh, rồi ghi vào file `%LOCALAPPDATA%\PixelOffice\squads\<manager>.json`; `child.ps1` đọc file đó để đặt biến môi trường). Hook không sửa được tham số lệnh đang chạy, nên cách chắc nhất là: **`launch.ps1` tự sinh squadId, ghi file, gửi sự kiện `squad_start` cho app, rồi truyền xuống `child.ps1` qua `-SquadId`.** Phiên manager được ghép vào nhà khi hook thấy lệnh `launch.ps1` (lấy squadId từ file mới nhất của manager đó).
- **Tên manager:** lấy từ tham số `-Manager` của `launch.ps1`, để ánh xạ `SendMessage(to: <tên manager>)` thành nhân vật Sếp Bơ.
- Phiên không có `PIXEL_OFFICE_SQUAD` và không phải manager đã đăng ký thì bỏ qua.

> Cần kiểm thực tế ở bước đầu cài đặt: in toàn bộ stdin của hook ra file log để xác nhận trường `session_title` và dạng `tool_input` của `SendMessage` (`{to, message, summary}` theo schema tool hiện tại). Tài liệu hooks chưa nói rõ về `SendMessage`.

### Ánh xạ sự kiện → hành động

| Sự kiện hook | Hành động nhân vật |
|---|---|
| `SessionStart` (phiên con) | nhân vật bước vào nhà, ngồi xuống bàn |
| `UserPromptSubmit` | đứng dậy đọc tin / bắt đầu làm: chuyển sang **làm việc** |
| `PreToolUse` Edit/Write/MultiEdit/NotebookEdit | **làm việc**: gõ phím |
| `PreToolUse` Bash/PowerShell | **làm việc**: gõ nhanh; nếu lệnh chứa `render` hoặc `ffmpeg` thì máy bốc khói, nhân vật quạt quạt |
| `PreToolUse` Read/Grep/Glob/WebFetch/WebSearch | **đọc**: ngó màn hình, cầm kính lúp (Na), lật sổ |
| `PreToolUse` claude-in-chrome `*` | **xem video**: màn hình chiếu cảnh, nhân vật chống cằm |
| `PreToolUse` `SendMessage` | **đưa tin**: cầm phong bì đi tới bàn người nhận, đặt xuống, quay về. Phong bì đỏ nếu dòng đầu bắt đầu bằng `[BLOCKED` hoặc `[FAIL` |
| `PreToolUse` Agent/Task (subagent) | gọi điện thoại (cầm máy bàn) |
| `PermissionRequest`, `Notification` loại `permission_prompt`/`idle_prompt`/`agent_needs_input` | **chờ bạn**: bước ra trước bàn, giơ tay, dấu "!" vàng phát sáng nhấp nháy |
| `Stop` | **nghỉ** theo kiểu riêng của từng người |
| nghỉ quá 3 phút | ngủ gật |
| `StopFailure`, `PostToolUseFailure` | gãi đầu, mây đen nhỏ trên đầu 3 giây |
| `SessionEnd` | đứng dậy, đi ra khỏi nhà; bàn trống, ghế xoay |

Sự kiện cũ hơn hành động đang diễn ra thì xếp hàng. Animation đi đưa tin chạy xong (khoảng 2–4 giây) rồi mới nhận trạng thái kế tiếp. Trạng thái tool rút lại về "làm việc" chung nếu 5 giây không có sự kiện mới.

Đi đưa tin giữa 2 tầng: nhân vật đi tới **cầu thang** ở cạnh phải ngôi nhà, lên/xuống, rồi đi tới bàn người nhận. Bản phác thảo chưa có cầu thang, cần thêm.

### Nhiều nhà cùng lúc

Nếu có 2 squad cùng chạy, cửa sổ hiện nhà mới nhất và có nút mũi tên trên thanh kéo để chuyển nhà. Đây là lựa chọn của tôi.

Vòng đời một nhà (lựa chọn của tôi):
- `launch.ps1 -Only <role>` (mở lại 1 pane chết) **dùng lại squadId hiện có** của manager đó (đọc từ file squad của manager). Nhân vật vai đó quay lại bàn.
- Chạy `launch.ps1` đầy đủ lần nữa từ cùng manager thì **thay nhà cũ** bằng nhà mới.
- Manager là phiên dài, có khi không bao giờ `SessionEnd`, nên nhà **kết thúc khi cả 4 phiên con đã `SessionEnd`** (hoặc manager `SessionEnd`). Khi đó đèn tắt dần, 10 phút sau nhà biến khỏi danh sách.
- Thứ tự: `launch.ps1` ghi file squad và gửi `squad_start` **trước** khi mở pane. Hook của manager ghép manager vào nhà ở `PostToolUse` của lệnh `launch.ps1` (lúc file đã có), không phải `PreToolUse`.

## Cài đặt

- Mã nguồn: `E:\aff\pixel-office\`.
- `npm run setup` (hoặc `setup.ps1`): cài phụ thuộc, **thêm** hook Pixel Office vào `~/.claude/settings.json` cho các sự kiện ở bảng trên với `"async": true`. Trước khi sửa thì sao lưu file thành `settings.json.bak-pixel-office`. Chạy lại nhiều lần không bị nhân đôi.
- Sửa `C:\Users\PC\.claude\skills\reels-squad\scripts\launch.ps1` và `child.ps1` để sinh và truyền `squadId` (thay đổi nhỏ, không ảnh hưởng gì nếu Pixel Office không chạy). Skill là một repo git riêng, commit trong repo đó.
- Chạy bằng `npm start`. Đóng gói thành `.exe` là việc tuỳ chọn, để sau.
- `npm run demo`: phát một kịch bản giả (squad 5 người giao việc, render, chờ duyệt) để xem app mà không cần chạy reels-squad thật.

## Để lại cho người làm

- Cấu trúc file và module, chi tiết vẽ sprite, cách chia renderer.
- Tối ưu vẽ (chỉ vẽ lại khi khung hình đổi, 6 fps).
- Cách vẽ cầu thang và đường đi giữa 2 tầng.
- Test: tối thiểu có test cho hook.js (rút gọn sự kiện, nuốt lỗi, không bao giờ treo) và cho máy trạng thái (sự kiện → hành động).

---

## Bản 2 (2026-10-21): khung cảnh nhìn chéo từ trên xuống, cửa sổ kéo giãn

Người dùng yêu cầu: "tôi muốn có thể resize, cái mà hover vào cạnh rồi kéo ra ấy, tôi muốn là 1 khung cảnh hoàn chỉnh, từ góc nhìn bird view, size dành cho pc desktop 800 x 600", kiểu "như stardew valley". Người dùng đã duyệt bản phác thảo `.superpowers/brainstorm/.../content/topdown.html` ("đúng rồi làm giúp tôi"). Phần này **thay** phần Phong cách / cửa sổ ở trên. Hook, server, não nhân vật, bong bóng và câu nói giữ nguyên.

- **Góc nhìn:** nhìn chéo từ trên xuống kiểu Stardew Valley. Tường sau có chiều cao, đồ đạc có mặt trên và mặt trước, nhân vật chibi quay mặt về phía người xem. Giữ bảng màu đêm ấm, ánh sáng theo bậc có dither, viền màu tối.
- **Cảnh:** logic **400×300 px**, mặc định cửa sổ **800×600** (×2). Gồm phòng sếp (trên trái), phòng làm việc 4 bàn 2×2 (trên phải, Na/Tí trên, Mây/Hồng dưới, Hồng có giá vẽ), phòng khách (sofa, bàn trà, máy arcade, ghế lười), bếp (máy pha cà phê, tủ lạnh, bàn ăn), sân vườn (trăng, sao, hàng rào, đèn, ghế đá, hồ, mèo, đom đóm). Các phòng nối nhau bằng cửa.
- **Cửa sổ:** không viền, luôn nổi trên cùng, **kéo cạnh để đổi kích thước**, khoá tỉ lệ 4:3, nhỏ nhất 400×300. Cảnh phóng theo **bội số nguyên** lớn nhất vừa cửa sổ (pixel sắc nét), phần dư là viền tối. Nhớ vị trí và kích thước. Kéo cửa sổ bằng dải trên cùng. Khay hệ thống: Hiện/Ẩn, Về 800×600, Thoát. (Lựa chọn của tôi: bỏ bo góc trong suốt vì Windows không cho kéo cạnh cửa sổ trong suốt.)
- **Di chuyển:** mỗi nhân vật có vị trí thật trong nhà và đi bộ theo lối đi qua các cửa (24 px/s) tới chỗ hợp với hành động:
  - làm việc / đọc / xem video / render / gọi điện / lỗi → ghế ở bàn mình
  - chờ bạn → đứng cạnh bàn, giơ tay, dấu "!"
  - đưa tin → đi tới bàn người nhận, cầm phong bì, rồi quay về bàn
  - nghỉ → chỗ nghỉ riêng: Sếp Bơ uống cà phê ở bàn ăn trong bếp, Na pha cà phê ở quầy bếp, Mây ngồi sofa, Tí chơi máy arcade, Hồng ngồi ghế đá ngoài vườn
  - ngủ gật → nằm trên sofa hoặc ghế lười
  - vào nhà / ra về → từ cổng vườn vào, hoặc ra cổng rồi biến mất
  (Chỗ nghỉ từng người là lựa chọn của tôi.)
- **Chữ:** bảng nhỏ góc trên trái "REELS SQUAD · N AGENT · trạng thái", không che bảng PLAN. Bảng tin ở đáy. Bong bóng phóng theo tỉ lệ cảnh.
