import os
import io
from flask import Blueprint, request, jsonify, current_app, send_from_directory, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.admin_service import AdminService
from ..services.product_service import ProductService
from ..services.order_service import OrderService

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
admin_service = AdminService()
product_service = ProductService()
order_service = OrderService()

# ─── Authentication ───────────────────────────────────────────────────────────

@admin_bp.route('/login', methods=['POST'])
def admin_login():
    """Authenticate admin and issue JWT."""
    data = request.get_json()
    result, status_code = admin_service.authenticate_admin(data)
    return jsonify(result), status_code

@admin_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_admin():
    """Get authenticated admin profile."""
    admin_id = int(get_jwt_identity())
    result, status_code = admin_service.get_admin_profile(admin_id)
    return jsonify(result), status_code

# ─── Dashboard Metrics ────────────────────────────────────────────────────────

@admin_bp.route('/metrics', methods=['GET'])
@jwt_required()
def get_metrics():
    """Return KPI metrics for admin dashboard."""
    result, status_code = admin_service.get_dashboard_metrics()
    return jsonify(result), status_code

# ─── Product Management ───────────────────────────────────────────────────────

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def list_products():
    """List paginated products for admin management."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '').strip()
    category = request.args.get('category', '').strip()
    result, status_code = product_service.list_admin_products(
        page=page, per_page=per_page, search=search, category=category
    )
    return jsonify(result), status_code

@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Create a new product."""
    data = request.get_json()
    result, status_code = product_service.create_product(data)
    return jsonify(result), status_code

@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id: int):
    """Update an existing product."""
    data = request.get_json()
    result, status_code = product_service.update_product(product_id, data)
    return jsonify(result), status_code

@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id: int):
    """Delete a product."""
    result, status_code = product_service.delete_product(product_id)
    return jsonify(result), status_code

# ─── Image Upload ─────────────────────────────────────────────────────────────

@admin_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_image():
    """Upload product image to Cloudinary or local storage."""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file field in request. Use key "file".'}), 400

    file = request.files['file']
    result, status_code = admin_service.upload_image(file, current_app.config)
    return jsonify(result), status_code

@admin_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_upload(filename: str):
    """Serve locally uploaded image files."""
    upload_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    return send_from_directory(os.path.abspath(upload_dir), filename)

# ─── Order Management ─────────────────────────────────────────────────────────

@admin_bp.route('/orders', methods=['GET'])
@jwt_required()
def list_orders():
    """List orders with filtering and pagination."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status_filter = request.args.get('status', '').strip().lower()
    search = request.args.get('search', '').strip()
    date_from = request.args.get('date_from', '').strip()
    date_to = request.args.get('date_to', '').strip()

    result, status_code = order_service.get_admin_orders(
        page=page,
        per_page=per_page,
        status=status_filter,
        search=search,
        date_from=date_from,
        date_to=date_to
    )
    return jsonify(result), status_code

@admin_bp.route('/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id: int):
    """Get full order details."""
    result, status_code = order_service.get_order(order_id)
    return jsonify(result), status_code

@admin_bp.route('/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id: int):
    """Update order fulfillment status or tracking."""
    data = request.get_json()
    result, status_code = order_service.update_order_status(order_id, data)
    return jsonify(result), status_code

# ─── PDF Invoice Generation ───────────────────────────────────────────────────

@admin_bp.route('/orders/<int:order_id>/invoice', methods=['GET'])
@jwt_required()
def download_invoice(order_id: int):
    """Generate and return a PDF or print-ready HTML invoice for the given order."""
    result, status_code = order_service.get_order(order_id)
    if not result.get('success'):
        return jsonify(result), status_code

    order = result['order']
    fmt = request.args.get('format', 'pdf').lower()

    if fmt == 'html':
        html = _build_invoice_html(order)
        response = make_response(html)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response

    try:
        from ..services.pdf_service import PDFInvoiceService
        pdf_bytes = PDFInvoiceService.generate_invoice_pdf(order)
        response = make_response(pdf_bytes)
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename="invoice-SS-{order_id}.pdf"'
        return response
    except Exception as e:
        current_app.logger.error(f"PDF generation failed, falling back to HTML: {e}")
        html = _build_invoice_html(order)
        response = make_response(html)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response


def _build_invoice_html(order: dict) -> str:
    """Build a print-ready HTML invoice for the given order dict."""
    from datetime import datetime
    items_rows = ''
    for item in order.get('items', []):
        items_rows += f"""
        <tr>
          <td>{item['product_title']}</td>
          <td>{item.get('size','Standard')}</td>
          <td style="text-align:center">{item['quantity']}</td>
          <td style="text-align:right">₹{item['price']:,.0f}</td>
          <td style="text-align:right">₹{item['subtotal']:,.0f}</td>
        </tr>"""

    discount_row = ''
    if order.get('discount_amount', 0) > 0:
        discount_row = f"""
        <tr>
          <td colspan="4" style="text-align:right">Discount ({order.get('coupon_code','')}):</td>
          <td style="text-align:right;color:#e11d48">-₹{order['discount_amount']:,.0f}</td>
        </tr>"""

    created_str = ''
    try:
        created_str = datetime.fromisoformat(order['created_at']).strftime('%d %b %Y, %I:%M %p')
    except Exception:
        created_str = order.get('created_at', '')

    tracking_section = ''
    if order.get('tracking_number'):
        tracking_section = f"""
        <div class="tracking">
          <strong>🚚 Shipped via {order.get('tracking_carrier','Courier')}</strong>
          &nbsp;|&nbsp; AWB: <strong>{order['tracking_number']}</strong>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice – SS-{order['id']} | Shaify Styles</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Inter', Arial, sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; }}
  .page {{ max-width: 780px; margin: 0 auto; padding: 32px; }}
  .header {{ display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 3px solid #9333ea; }}
  .brand {{ font-size: 26px; font-weight: 700; color: #9333ea; letter-spacing: -0.5px; }}
  .brand small {{ display: block; font-size: 11px; color: #6b7280; font-weight: 400; letter-spacing: 0.5px; }}
  .invoice-meta {{ text-align: right; }}
  .invoice-meta h1 {{ font-size: 20px; color: #9333ea; }}
  .invoice-meta p {{ color: #6b7280; font-size: 12px; }}
  .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }}
  .info-box h4 {{ font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9333ea; margin-bottom: 6px; }}
  .info-box p {{ line-height: 1.7; color: #374151; }}
  .status-badge {{ display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
    background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
  th {{ background: #f5f3ff; color: #7e22ce; font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 10px 12px; text-align: left; }}
  td {{ padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }}
  tbody tr:nth-child(even) {{ background: #fafafa; }}
  .total-row td {{ font-weight: 700; font-size: 15px; color: #9333ea; border-top: 2px solid #9333ea; padding-top: 12px; }}
  .tracking {{ margin-top: 20px; padding: 12px 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; color: #166534; }}
  .footer {{ margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; line-height: 2; }}
  @media print {{ body {{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }} }}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">Shaify Styles<small>@shaifystyles_ · Modest Elegance</small></div>
    </div>
    <div class="invoice-meta">
      <h1>INVOICE</h1>
      <p>Order #SS-{order['id']}</p>
      <p>{created_str}</p>
      <p style="margin-top:6px"><span class="status-badge">{order['status'].upper()}</span></p>
    </div>
  </div>

  <div class="grid">
    <div class="info-box">
      <h4>Bill To</h4>
      <p><strong>{order['customer_name']}</strong><br>
         {order['customer_phone']}<br>
         {order['customer_email']}</p>
    </div>
    <div class="info-box">
      <h4>Ship To</h4>
      <p>{order['shipping_address']}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Size</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      {items_rows}
    </tbody>
    <tfoot>
      {discount_row}
      <tr class="total-row">
        <td colspan="4" style="text-align:right">Total Amount Paid:</td>
        <td style="text-align:right">₹{order['total_amount']:,.0f}</td>
      </tr>
    </tfoot>
  </table>

  {tracking_section}

  {'<div class="tracking" style="background:#fff7ed;border-color:#fed7aa;color:#9a3412;margin-top:12px"><strong>Customer Note:</strong> ' + order['notes'] + '</div>' if order.get('notes') else ''}

  {'<p style="margin-top:16px;color:#6b7280;font-size:12px">Razorpay Payment ID: <code>' + order.get('razorpay_payment_id','') + '</code></p>' if order.get('razorpay_payment_id') else ''}

  <div class="footer">
    <p>Thank you for shopping with <strong>Shaify Styles</strong> — Modest Elegance 🌸</p>
    <p>Instagram: @shaifystyles_ &nbsp;|&nbsp; This is a computer-generated invoice</p>
  </div>
</div>
</body>
</html>"""

# ─── Deployment & Infrastructure Status ───────────────────────────────────────

@admin_bp.route('/deployment-status', methods=['GET'])
@jwt_required()
def get_deployment_status():
    """Inspect backend infrastructure and external services status."""
    result, status_code = admin_service.get_system_status(current_app.config)
    return jsonify(result), status_code

