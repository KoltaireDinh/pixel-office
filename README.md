# Pixel Office

Ngôi nhà pixel 8-bit (nhìn từ trên xuống, kiểu Stardew Valley) cho thấy các agent của `/reels-squad` đang làm gì: ngồi gõ phím, đọc tài liệu, đi đưa thư cho nhau, nghỉ uống cà phê, ngủ gật... Chạy như một app desktop nhỏ, luôn nổi trên màn hình.

## Cài đặt (Windows)

1. Tải **`Pixel Office Setup x.y.z.exe`** ở trang [Releases](https://github.com/KoltaireDinh/pixel-office/releases/latest) và chạy. Không cần quyền admin. Windows có thể hiện "Windows protected your PC" vì app chưa ký số → bấm **More info → Run anyway**.
2. App tự mở, tự thêm hook vào `~/.claude/settings.json` (có bản sao lưu `settings.json.bak-pixel-office`). Máy cần có **Node.js** trong PATH vì Claude Code chạy hook bằng `node`.
3. Cập nhật skill `reels-squad` để squad hiện thành nhân vật:

   ```powershell
   git clone https://github.com/KoltaireDinh/reels-squad.git $HOME\.claude\skills\reels-squad
   # đã có rồi thì: cd $HOME\.claude\skills\reels-squad; git pull
   ```

4. Chạy `/reels-squad` như bình thường — app tự bật khi squad khởi động.

Chuột phải icon ngôi nhà ở khay hệ thống: Hiện/Ẩn, Về 800×600, **Chạy cùng Windows**, **Gỡ hook Claude Code & thoát** (bấm cái này trước khi gỡ cài đặt app).

## Chạy từ mã nguồn

Cần Node.js 20+ và Git.

```powershell
git clone https://github.com/KoltaireDinh/pixel-office.git
cd pixel-office
npm install
npm run setup     # thêm hook trỏ vào thư mục mã nguồn
npm start
```

`npm run dist` đóng gói bộ cài vào `dist/`.

## Lệnh khác

| Lệnh | Việc |
|---|---|
| `npm run demo -- --loop` | Squad giả để xem thử (cần app đang chạy) |
| `npm run preview` | Chạy server không có Electron, mở http://127.0.0.1:47821/ trong trình duyệt |
| `npm test` | Chạy test |
| `npm run setup -- --uninstall` | Gỡ hook |

Cửa sổ: kéo cạnh để đổi cỡ (giữ tỉ lệ 4:3), kéo dải trên cùng để di chuyển. Icon ở khay hệ thống có Hiện/Ẩn, "Về 800×600" và Thoát. Thêm `?debug=all` vào URL preview để xem mọi động tác.

## Riêng tư

Hook chỉ gửi lên `127.0.0.1` loại công cụ và một dòng tiêu đề ngắn (dòng `TASK …` hoặc `[DONE|BLOCKED|FAIL]`, tối đa 60 ký tự) — không gửi nội dung prompt hay code. Hook luôn thoát ngay, không bao giờ chặn Claude Code.
