# Pixel Office

Ngôi nhà pixel 8-bit (nhìn từ trên xuống, kiểu Stardew Valley) cho thấy các agent của `/reels-squad` đang làm gì: ngồi gõ phím, đọc tài liệu, đi đưa thư cho nhau, nghỉ uống cà phê, ngủ gật... Chạy như một app desktop nhỏ, luôn nổi trên màn hình.

## Cài trên máy mới (Windows)

Cần: Node.js 20+, Git, Claude Code.

```powershell
git clone https://github.com/KoltaireDinh/pixel-office.git
cd pixel-office
npm install
npm run setup     # thêm hook Pixel Office vào ~/.claude/settings.json (có backup .bak-pixel-office)
npm start         # mở cửa sổ
```

Để squad hiện thành nhân vật, cần bản skill `reels-squad` có hỗ trợ Pixel Office:

```powershell
git clone https://github.com/KoltaireDinh/reels-squad.git $HOME\.claude\skills\reels-squad
# hoặc nếu đã có: cd $HOME\.claude\skills\reels-squad; git pull
```

Sau đó chạy `/reels-squad` như bình thường — app tự bật khi squad khởi động.

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
