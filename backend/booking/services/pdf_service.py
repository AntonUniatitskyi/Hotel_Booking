from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import qrcode
import io

class InvoicePDFGenerator:
    def __init__(self, booking):
        self.booking = booking

    def generate(self) -> io.BytesIO:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer)
        self._draw_header(p)
        self._draw_details(p)
        self._draw_qr(p)
        p.showPage()
        p.save()
        buffer.seek(0)
        return buffer

    def _draw_header(self, p):
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 800, f"Booking Confirmation #{self.booking.id}")

    def _draw_details(self, p):
        b = self.booking
        full_name = b.client.user.get_full_name() or b.client.user.username
        lines = [
            (770, f"Hotel: {b.room.hostel.name}"),
            (750, f"Address: {b.room.hostel.city}, {b.room.hostel.address}"),
            (730, f"Guest: {full_name}"),
            (710, f"Dates: {b.start_date} - {b.last_date}"),
            (690, f"Total Price: ${b.price}"),
        ]
        p.setFont("Helvetica", 12)
        for y, text in lines:
            p.drawString(100, y, text)

    def _draw_qr(self, p):
        data = f"Booking ID: {self.booking.id} | Status: {self.booking.approved}"
        qr_buffer = io.BytesIO()
        qrcode.make(data).save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        p.drawImage(ImageReader(qr_buffer), 100, 550, width=100, height=100)
