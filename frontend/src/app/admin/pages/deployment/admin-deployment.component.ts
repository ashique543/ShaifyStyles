import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../services/admin-api.service';

@Component({
  selector: 'app-admin-deployment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-deployment.component.html'
})
export class AdminDeploymentComponent implements OnInit {
  private adminApi = inject(AdminApiService);

  status: any = null;
  isLoading = false;
  selectedGuide: 'backend' | 'frontend' | 'database' | 'auth' | 'env' = 'backend';
  copiedNotice = false;

  envTemplate = `# =================================================================
# SHAIFY STYLES BOUTIQUE - PRODUCTION ENVIRONMENT CONFIGURATION
# =================================================================
FLASK_ENV=production
SECRET_KEY=generate_a_random_32_character_hex_secret_here
JWT_SECRET_KEY=generate_another_strong_jwt_secret_key_here
JWT_ACCESS_TOKEN_EXPIRES_HOURS=720

# --- Database Connection (PostgreSQL on Supabase, Neon, or Render) ---
DATABASE_URL=postgresql://user:password@hostname:5432/shaifystyles?sslmode=require

# --- Razorpay Live Payment Gateway Keys ---
RAZORPAY_KEY_ID=rzp_live_YourLiveKeyIdHere
RAZORPAY_KEY_SECRET=YourLiveRazorpayKeySecretHere

# --- Google Sign-In OAuth 2.0 Client ---
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# --- Mobile Phone OTP Configuration ---
SMS_GATEWAY=fast2sms
FAST2SMS_API_KEY=your_fast2sms_api_key_here
OTP_EXPIRY_MINUTES=10
DEMO_OTP=123456

# --- Cloudinary Cloud Image Storage (Optional) ---
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# --- Store Brand Info ---
BRAND_NAME="Shaify Styles"
BRAND_INSTAGRAM="@shaifystyles_"
WHATSAPP_PHONE="919876543210"
`;

  ngOnInit(): void {
    this.loadDeploymentStatus();
  }

  loadDeploymentStatus(): void {
    this.isLoading = true;
    this.adminApi.getDeploymentStatus().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.status = res.status;
        }
      },
      error: () => {
        this.isLoading = false;
        // Fallback default status preview
        this.status = {
          database: { is_production_ready: false, type: 'SQLite (Local File)', target: 'PostgreSQL on Render / Supabase' },
          razorpay: { is_live: false, status: 'Test Mode (Active)', key_id_preview: 'rzp_test_...' },
          google_oauth: { configured: false, status: 'One-Click Dev Bypass active', client_id_preview: 'Not Set' },
          sms_otp: { configured: false, status: 'Simulation Mode (Code: 123456)', gateway: 'simulation', demo_otp: '123456' },
          media_storage: { is_cloud: false, provider: 'Local Disk Storage', status: 'uploads/ folder' }
        };
      }
    });
  }

  copyText(text: string): void {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  copyAllEnv(): void {
    this.copyText(this.envTemplate);
    this.copiedNotice = true;
    setTimeout(() => {
      this.copiedNotice = false;
    }, 2500);
  }
}
