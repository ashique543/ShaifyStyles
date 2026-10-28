import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerAuthService } from '../../services/customer-auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html'
})
export class AuthModalComponent implements OnDestroy {
  authService = inject(CustomerAuthService);

  activeTab: 'otp' | 'google' = 'otp';
  otpStep: 'phone' | 'verify' = 'phone';

  phoneNumber: string = '';
  customerName: string = '';
  otpCode: string = '';
  demoOtpHint: string = '';

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  resendTimer: number = 0;
  private timerInterval: any;

  switchTab(tab: 'otp' | 'google'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  sendOtpCode(): void {
    const cleanPhone = this.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      this.errorMessage = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.sendOtp(cleanPhone).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.otpStep = 'verify';
          this.demoOtpHint = res.demo_otp || '123456';
          this.successMessage = res.message || 'Verification code sent!';
          this.startCountdown(res.expires_in_seconds ? Math.min(res.expires_in_seconds, 60) : 60);
        } else {
          this.errorMessage = res.message || 'Failed to send OTP code. Please retry.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Network error while requesting OTP.';
      }
    });
  }

  verifyOtpCode(): void {
    if (!this.otpCode || this.otpCode.length < 6) {
      this.errorMessage = 'Please enter the complete 6-digit code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.verifyOtp(this.phoneNumber, this.otpCode, this.customerName).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = res.message || 'Logged in successfully!';
          setTimeout(() => {
            this.close();
          }, 800);
        } else {
          this.errorMessage = res.message || 'Verification failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid or expired verification code.';
      }
    });
  }

  autoFillDemoOtp(): void {
    this.otpCode = this.demoOtpHint || '123456';
  }

  selectDevProfile(name: string, email: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.loginWithGoogle({
      name,
      email,
      google_id: `demo_google_${email.split('@')[0]}`
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.successMessage = res.message || `Welcome, ${name}!`;
          setTimeout(() => {
            this.close();
          }, 800);
        } else {
          this.errorMessage = res.message || 'Google sign-in failed.';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Could not complete Google sign-in.';
      }
    });
  }

  signInWithGoogleClient(): void {
    // If Google Identity Services script is available on window
    const win = window as any;
    if (win.google && win.google.accounts && win.google.accounts.id) {
      try {
        win.google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('Google prompt not initialized:', e);
      }
    }
    // Fallback: Use one-click primary demo account
    this.selectDevProfile('Ayesha Khan', 'ayesha.khan@example.com');
  }

  startCountdown(seconds: number): void {
    this.clearCountdown();
    this.resendTimer = seconds;
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.clearCountdown();
      }
    }, 1000);
  }

  clearCountdown(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  close(): void {
    this.clearCountdown();
    this.errorMessage = '';
    this.successMessage = '';
    this.otpCode = '';
    this.authService.closeAuthModal();
  }

  onBackdropClick(event: MouseEvent): void {
    this.close();
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }
}
