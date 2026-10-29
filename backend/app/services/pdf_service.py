import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFInvoiceService:
    """
    Generates branded PDF invoices for Shaify Styles orders using ReportLab.
    """

    @staticmethod
    def generate_invoice_pdf(order: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()

        brand_title = ParagraphStyle(
            'BrandTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#7e22ce'),
            fontName='Helvetica-Bold',
            spaceAfter=2
        )
        brand_sub = ParagraphStyle(
            'BrandSub',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#6b7280')
        )
        inv_title = ParagraphStyle(
            'InvTitle',
            parent=styles['Heading2'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#4c1d95'),
            fontName='Helvetica-Bold',
            alignment=2
        )
        inv_meta = ParagraphStyle(
            'InvMeta',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#4b5563'),
            alignment=2
        )
        section_h = ParagraphStyle(
            'SectionH',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#6b21a8')
        )
        body_p = ParagraphStyle(
            'BodyP',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1f2937')
        )
        footer_p = ParagraphStyle(
            'FooterP',
            parent=styles['Normal'],
            fontSize=8,
            leading=12,
            textColor=colors.HexColor('#9ca3af'),
            alignment=1
        )

        story = []

        # ── Header ────────────────────────────────────────────────────────────
        created_str = ''
        try:
            created_str = datetime.fromisoformat(order.get('created_at', '')).strftime('%d %b %Y, %I:%M %p')
        except Exception:
            created_str = str(order.get('created_at', ''))

        status_text = (order.get('status') or 'CONFIRMED').upper()

        header_table = Table([
            [
                Paragraph('<b>SHAIFY STYLES</b>', brand_title),
                Paragraph(f'<b>TAX INVOICE</b><br/>#SS-{order.get("id", "")}', inv_title)
            ],
            [
                Paragraph('Handcrafted Luxury & Modest Wear · @shaifystyles_', brand_sub),
                Paragraph(f'Date: {created_str}<br/>Status: <b>{status_text}</b>', inv_meta)
            ]
        ], colWidths=[320, 220])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#9333ea'), spaceAfter=14))

        # ── Billing & Shipping Info ───────────────────────────────────────────
        cust_name = order.get('customer_name', 'Valued Customer')
        cust_phone = order.get('customer_phone', '')
        cust_email = order.get('customer_email', '')
        ship_addr = order.get('shipping_address', '')

        info_table = Table([
            [
                Paragraph('<b>BILLED TO</b>', section_h),
                Paragraph('<b>DELIVERY ADDRESS</b>', section_h)
            ],
            [
                Paragraph(f'<b>{cust_name}</b><br/>Phone: {cust_phone}<br/>Email: {cust_email}', body_p),
                Paragraph(f'{ship_addr}', body_p)
            ]
        ], colWidths=[270, 270])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#faf5ff')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e9d5ff')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f3e8ff')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 16))

        # ── Items Table ───────────────────────────────────────────────────────
        items = order.get('items', [])
        table_rows = [
            [
                Paragraph('<b>#</b>', section_h),
                Paragraph('<b>Item Description</b>', section_h),
                Paragraph('<b>Size</b>', section_h),
                Paragraph('<b>Qty</b>', section_h),
                Paragraph('<b>Unit Price</b>', section_h),
                Paragraph('<b>Subtotal</b>', section_h)
            ]
        ]

        subtotal = 0.0
        for idx, item in enumerate(items, 1):
            p_title = item.get('product_title', 'Product')
            size = item.get('size', 'Standard')
            qty = int(item.get('quantity', 1))
            price = float(item.get('price', 0.0))
            line_sub = float(item.get('subtotal', price * qty))
            subtotal += line_sub

            table_rows.append([
                Paragraph(str(idx), body_p),
                Paragraph(p_title, body_p),
                Paragraph(size, body_p),
                Paragraph(str(qty), body_p),
                Paragraph(f'Rs. {price:,.0f}', body_p),
                Paragraph(f'Rs. {line_sub:,.0f}', body_p)
            ])

        # Financial Summary Rows
        discount_amt = float(order.get('discount_amount', 0.0) or 0.0)
        coupon_code = order.get('coupon_code')
        grand_total = float(order.get('total_amount', subtotal - discount_amt))

        if discount_amt > 0:
            disc_label = f'Coupon Discount ({coupon_code}):' if coupon_code else 'Discount:'
            table_rows.append([
                '', '', '', '',
                Paragraph(f'<b>{disc_label}</b>', body_p),
                Paragraph(f'<font color="#dc2626"><b>-Rs. {discount_amt:,.0f}</b></font>', body_p)
            ])

        table_rows.append([
            '', '', '', '',
            Paragraph('<b>Delivery / Shipping:</b>', body_p),
            Paragraph('<font color="#16a34a"><b>FREE</b></font>', body_p)
        ])

        total_style = ParagraphStyle(
            'TotalStyle',
            parent=body_p,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#7e22ce'),
            fontName='Helvetica-Bold'
        )
        table_rows.append([
            '', '', '', '',
            Paragraph('<b>Grand Total:</b>', total_style),
            Paragraph(f'<b>Rs. {grand_total:,.0f}</b>', total_style)
        ])

        items_table = Table(table_rows, colWidths=[24, 216, 70, 40, 95, 95])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3e8ff')),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (2, 0), (3, -1), 'CENTER'),
            ('ALIGN', (4, 0), (-1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, len(items)), 0.5, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, 0), 1.5, colors.HexColor('#9333ea')),
            ('LINEABOVE', (4, -1), (5, -1), 1.5, colors.HexColor('#9333ea')),
            ('BACKGROUND', (4, -1), (5, -1), colors.HexColor('#faf5ff')),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 14))

        # ── Tracking & Notes ──────────────────────────────────────────────────
        tracking_num = order.get('tracking_number')
        carrier = order.get('tracking_carrier') or 'Courier'
        rzp_id = order.get('razorpay_payment_id') or order.get('razorpay_order_id')
        notes = order.get('notes')

        extra_rows = []
        if tracking_num:
            extra_rows.append([
                Paragraph(f'<b>Courier Dispatch:</b> Shipped via <b>{carrier}</b> &nbsp;|&nbsp; AWB Tracking: <b>{tracking_num}</b>', body_p)
            ])
        if rzp_id:
            extra_rows.append([
                Paragraph(f'<b>Payment Reference:</b> Razorpay ID: <font face="Courier">{rzp_id}</font>', body_p)
            ])
        if notes:
            extra_rows.append([
                Paragraph(f'<b>Customer Ribbon / Gift Note:</b> <i>"{notes}"</i>', body_p)
            ])

        if extra_rows:
            extra_table = Table(extra_rows, colWidths=[540])
            extra_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(extra_table)
            story.append(Spacer(1, 16))

        # ── Footer ────────────────────────────────────────────────────────────
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#d1d5db'), spaceAfter=8))
        story.append(Paragraph(
            'Thank you for choosing <b>Shaify Styles</b> · Modest Elegance<br/>'
            'For returns, exchanges, or styling inquiries, connect with us on Instagram <b>@shaifystyles_</b><br/>'
            'This is a computer-generated tax invoice. No signature is required.',
            footer_p
        ))

        doc.build(story)
        return buffer.getvalue()
