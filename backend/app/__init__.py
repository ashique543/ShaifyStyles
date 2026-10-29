import os
import click
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
from .config import Config
from .models import db, bcrypt
from .repositories import AdminRepository
from .controllers import products_bp, orders_bp, admin_bp, auth_bp, category_bp, coupon_bp

from .seed import seed_database
from sqlalchemy import inspect, text

def _safe_migrations(db):
    """Safely adds new columns to SQLite tables if they do not yet exist."""
    try:
        insp = inspect(db.engine)
        if 'orders' in insp.get_table_names():
            existing_cols = {c['name'] for c in insp.get_columns('orders')}
            with db.engine.connect() as conn:
                if 'notes' not in existing_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN notes TEXT"))
                if 'tracking_carrier' not in existing_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_carrier VARCHAR(100)"))
                if 'tracking_number' not in existing_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(200)"))
                if 'coupon_code' not in existing_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50)"))
                if 'discount_amount' not in existing_cols:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN discount_amount FLOAT DEFAULT 0.0"))
                conn.commit()
    except Exception as e:
        pass

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # JWT token expiry as timedelta (Config stores it as seconds int)
    token_expires_seconds = app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 43200)
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=token_expires_seconds)

    # Enable CORS for frontend clients
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    JWTManager(app)

    # Register Blueprints (Controllers)
    app.register_blueprint(products_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(coupon_bp)


    # ── Health Check ─────────────────────────────────────────────────────────
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'brand': app.config.get('BRAND_NAME', 'Shaify Styles'),
            'instagram': app.config.get('BRAND_INSTAGRAM', '@shaifystyles_'),
            'database': 'connected',
            'razorpay_configured': bool(app.config.get('RAZORPAY_KEY_ID')),
            'admin_panel': 'enabled'
        }), 200

    # ── Error Handlers ────────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Internal server error'}), 500

    # ── CLI Commands ──────────────────────────────────────────────────────────
    @app.cli.command('create-admin')
    @click.option('--username', prompt='Admin username', help='Unique admin username')
    @click.option('--email', prompt='Admin email', help='Admin email address')
    @click.option('--password', prompt=True, hide_input=True,
                  confirmation_prompt=True, help='Admin password (will be hashed)')
    def create_admin_command(username, email, password):
        """Create the initial admin user for the Shaify Styles store panel."""
        with app.app_context():
            admin_repo = AdminRepository()
            existing = admin_repo.get_by_username_or_email(username, email)
            if existing:
                click.echo(f'ERROR: Admin with username "{username}" or email "{email}" already exists.')
                return
            admin = admin_repo.create(username, email, password)
            click.echo(f'SUCCESS: Admin "{admin.username}" created! You can now log in at /admin/login.')

    # ── Ensure upload directory exists ────────────────────────────────────────
    upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    # ── Create tables and auto-seed on startup ────────────────────────────────
    with app.app_context():
        db.create_all()
        # Safe migration check for local SQLite when upgrading existing DBs
        _safe_migrations(db)

        try:
            seed_database()
        except Exception as e:
            app.logger.warning(f"Seed note: {e}")

        # Seed default categories if the table is empty
        try:
            from .repositories.category_repository import CategoryRepository
            CategoryRepository().seed_defaults()
        except Exception as e:
            app.logger.warning(f"Category seed note: {e}")


    return app

# Module-level instance for WSGI runners
app = create_app()

