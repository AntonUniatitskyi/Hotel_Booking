from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.ttfonts import TTFError
from reportlab.lib.pagesizes import A4
from pathlib import Path
from reportlab.lib import colors
import io

SERVICE_DIR = Path(__file__).resolve().parent


try:
    pdfmetrics.registerFont(TTFont('DejaVu', str(SERVICE_DIR / 'DejaVuSans.ttf')))
    pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(SERVICE_DIR / 'DejaVuSans-Bold.ttf')))
    FONT_BOLD = 'DejaVu-Bold'
    FONT_REGULAR = 'DejaVu'
except (TTFError, FileNotFoundError):
    FONT_BOLD = "Helvetica-Bold"
    FONT_REGULAR = "Helvetica"


def truncate_text(canvas_obj, text: str, font: str, font_size: int, max_width: float) -> str:
    if canvas_obj.stringWidth(text, font, font_size) <= max_width:
        return text
    while text and canvas_obj.stringWidth(text + "...", font, font_size) > max_width:
        text = text[:-1]
    return text + "..."

class InvoicePDFGenerator:
    def __init__(self, booking):
        self.booking = booking

    def generate(self) -> io.BytesIO:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        self._draw_accent_line(p)
        self._draw_header(p)
        self._draw_details(p)
        self._draw_qr(p)
        self._draw_footer(p)
        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer

    def _draw_accent_line(self, p):
        p.setFillColor(colors.HexColor("#1e3a8a"))
        width, height = A4
        p.rect(0, height - 20, width, 20, fill=True, stroke=False)

    def _draw_header(self, p):
        p.setFillColor(colors.black)
        p.setFont(FONT_BOLD, 22)
        p.drawString(50, 780, "Arasaka")
        p.setFont(FONT_REGULAR, 12)
        p.drawRightString(550, 785, f"ID Бронювання: #{self.booking.id}")

        p.setStrokeColor(colors.lightgrey)
        p.line(50, 765, 550, 765)

    def _draw_details(self, p):
        b = self.booking
        full_name = b.client.user.get_full_name() or b.client.user.username
        LEFT_MAX_WIDTH = 270
        RIGHT_MAX_WIDTH = 180
        hotel_name = truncate_text(p, f"Готель: {b.room.hostel.name}", FONT_REGULAR, 11, LEFT_MAX_WIDTH)
        address = truncate_text(p, f"Адреса: {b.room.hostel.city}, {b.room.hostel.address}", FONT_REGULAR, 11,
                                LEFT_MAX_WIDTH)
        guest_name = truncate_text(p, f"Гість: {full_name}", FONT_REGULAR, 11, RIGHT_MAX_WIDTH)
        period = truncate_text(p, f"Період: {b.start_date} — {b.last_date}", FONT_REGULAR, 11, RIGHT_MAX_WIDTH)

        p.setFont(FONT_BOLD, 12)
        p.drawString(50, 740, "Деталі готелю:")
        p.setFont(FONT_REGULAR, 11)
        p.drawString(50, 725, hotel_name)
        p.drawString(50, 710, address)

        p.setFont(FONT_BOLD, 12)
        p.drawString(350, 740, "Інформація про гостя:")
        p.setFont(FONT_REGULAR, 11)
        p.drawString(350, 725, guest_name)
        p.drawString(350, 710, period)

        p.setFillColor(colors.HexColor("#f8fafc"))
        p.rect(50, 640, 500, 40, fill=True, stroke=True)
        p.setFillColor(colors.black)
        p.setFont(FONT_BOLD, 14)
        p.drawString(60, 655, "Загальна вартість:")
        p.drawRightString(540, 655, f"${b.price}")

    def _draw_qr(self, p):
        data = f"https://github.com/AntonUniatitskyi/Hotel_Booking"
        qr_buffer = io.BytesIO()
        qrcode.make(data).save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        qr_x, qr_y, qr_size = 475, 550, 70
        p.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size)
        p.setFont(FONT_REGULAR, 7)
        center_x = qr_x + qr_size / 2
        p.drawCentredString(center_x, qr_y - 12, "Відскануйте для перевірки")

    def _draw_footer(self, p):
        p.setFont(FONT_REGULAR, 9)
        p.setFillColor(colors.grey)
        p.drawCentredString(300, 50, "Дякуємо, що обрали нас!")
