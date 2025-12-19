// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { User } from '@live-chat/shared';
import { config } from 'process';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    console.log(configService.get<string>('MAIL_USER'));
    console.log(configService.get<string>('MAIL_APP_PASSWORD'));
    // Create a transporter object using the SMTP transport
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'), // 'smtp.gmail.com'
      port: this.configService.get<number>('MAIL_PORT'), // 465
      secure: this.configService.get<boolean>('MAIL_SECURE'), // true
      auth: {
        user: this.configService.get<string>('MAIL_USER'), // Your Gmail address from .env
        pass: this.configService.get<string>('MAIL_APP_PASSWORD'), // Your App Password from .env
      },
    });
  }

  /**
   * Sends an email.
   * @param to The recipient's email address.
   * @param subject The subject of the email.
   * @param html The HTML content of the email.
   */
  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"Live Chat" <${this.configService.get<string>('MAIL_USER')}>`, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      // Depending on your app's needs, you might want to throw the error
      // or handle it gracefully.
      throw new Error('Could not send email.');
    }
  }

  async sendUserConfirmation(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;

    const subject =
      'Chào mừng bạn đến với Live Chat! Vui lòng xác thực email của bạn';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Live Chat. Vui lòng nhấp vào liên kết bên dưới để xác thực địa chỉ email của bạn:</p>
      <a href="${url}">Xác thực Email</a>
      <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ Live Chat</p>
    `;

    await this.sendMail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;

    const subject = 'Đặt lại mật khẩu tài khoản Live Chat';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Live Chat của mình. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
      <a href="${url}">Đặt lại mật khẩu</a>
      <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
      <p>Trân trọng,<br>Đội ngũ Live Chat</p>
    `;

    await this.sendMail(user.email, subject, html);
  }

  /**
   * Send email change verification to new email address
   * @param user User requesting email change
   * @param newEmail New email address
   * @param token Verification token
   */
  async sendEmailChangeVerification(
    user: User,
    newEmail: string,
    token: string
  ) {
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
    const url = `${apiBaseUrl}/auth/verify-email-change?token=${token}`;

    const subject = 'Xác nhận thay đổi địa chỉ email - Live Chat';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>Bạn đã yêu cầu thay đổi địa chỉ email của tài khoản Live Chat từ <strong>${user.email}</strong> sang <strong>${newEmail}</strong>.</p>
      <p>Để hoàn tất quá trình thay đổi, vui lòng nhấp vào liên kết bên dưới:</p>
      <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">Xác nhận thay đổi email</a>
      <p>Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
      <p>${url}</p>
      <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
      <p><strong>⚠️ Lưu ý quan trọng về bảo mật:</strong></p>
      <ul>
        <li><strong>Sau khi xác nhận thay đổi, bạn sẽ BỊ ĐĂNG XUẤT NGAY LẬP TỨC khỏi tất cả thiết bị.</strong></li>
        <li>Điều này bao gồm: máy tính, điện thoại, máy tính bảng và mọi thiết bị khác đang đăng nhập.</li>
        <li>Bạn cần đăng nhập lại bằng email mới: <strong>${newEmail}</strong></li>
        <li>Nếu bạn có tài khoản Google liên kết, nó sẽ tự động bị hủy liên kết do email không còn khớp.</li>
      </ul>
      <p><strong>Nếu bạn không yêu cầu thay đổi này:</strong></p>
      <ul>
        <li>⛔ KHÔNG nhấp vào liên kết xác nhận</li>
        <li>🔒 Đổi mật khẩu tài khoản của bạn ngay lập tức</li>
        <li>📧 Liên hệ với chúng tôi ngay để được hỗ trợ</li>
      </ul>
      <p>Trân trọng,<br>Đội ngũ Live Chat</p>
    `;

    await this.sendMail(newEmail, subject, html);
  }

  /**
   * Send confirmation to old email address after successful email change
   * @param oldEmail Old email address
   * @param newEmail New email address
   * @param userName User's full name
   */
  async sendEmailChangeConfirmation(
    oldEmail: string,
    newEmail: string,
    userName: string
  ) {
    const subject = '✅ Xác nhận: Email đã được thay đổi - Live Chat';
    const html = `
      <p>Chào ${userName},</p>
      <p>✅ <strong>Email tài khoản Live Chat của bạn đã được thay đổi thành công.</strong></p>
      
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>📧 Thông tin thay đổi:</strong></p>
        <ul style="margin: 8px 0;">
          <li>Email cũ: <strong>${oldEmail}</strong></li>
          <li>Email mới: <strong>${newEmail}</strong></li>
          <li>Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
        </ul>
      </div>

      <p><strong>🔒 Các thay đổi bảo mật đã được thực hiện:</strong></p>
      <ul>
        <li>✅ Tất cả phiên đăng nhập đã bị đăng xuất khỏi mọi thiết bị</li>
        <li>✅ Tất cả tài khoản liên kết (Google, v.v.) đã bị hủy liên kết</li>
        <li>✅ Địa chỉ email đăng nhập mới: <strong>${newEmail}</strong></li>
      </ul>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>⚠️ QUAN TRỌNG:</strong></p>
        <p style="margin: 8px 0 0 0;">Nếu bạn KHÔNG thực hiện thay đổi này, vui lòng liên hệ với chúng tôi <strong>NGAY LẬP TỨC</strong> để được hỗ trợ khôi phục tài khoản.</p>
      </div>

      <p>Email này được gửi đến địa chỉ email cũ của bạn để xác nhận việc thay đổi đã hoàn tất.</p>
      <p>Trân trọng,<br>Đội ngũ Live Chat</p>
    `;

    await this.sendMail(oldEmail, subject, html);
  }

  /**
   * Send notification to old email address about email change request
   * @param user User requesting email change
   * @param newEmail New email address
   */
  async sendEmailChangeNotification(user: User, newEmail: string) {
    const subject = '⚠️ Cảnh báo: Yêu cầu thay đổi email - Live Chat';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>🔔 <strong>Chúng tôi nhận được yêu cầu thay đổi địa chỉ email</strong> của tài khoản Live Chat của bạn:</p>
      <ul>
        <li>📧 Email hiện tại: <strong>${user.email}</strong></li>
        <li>📧 Email mới: <strong>${newEmail}</strong></li>
        <li>🕐 Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</li>
      </ul>
      <p>Một email xác nhận đã được gửi đến địa chỉ email mới. Email của bạn sẽ chỉ được thay đổi sau khi xác nhận từ địa chỉ email mới.</p>
      
      <p><strong>⚠️ Điều gì sẽ xảy ra khi email được thay đổi:</strong></p>
      <ul>
        <li>🚪 Bạn sẽ bị đăng xuất khỏi <strong>TẤT CẢ</strong> thiết bị (máy tính, điện thoại, máy tính bảng, v.v.)</li>
        <li>🔗 Tất cả tài khoản liên kết (Google, v.v.) sẽ tự động bị hủy liên kết</li>
        <li>🔑 Bạn cần đăng nhập lại bằng email mới</li>
      </ul>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>🚨 NẾU BẠN KHÔNG THỰC HIỆN YÊU CẦU NÀY:</strong></p>
      </div>
      <ul>
        <li>⛔ Đăng nhập vào tài khoản của bạn và <strong>HỦY YÊU CẦU</strong> ngay lập tức</li>
        <li>🔒 Thay đổi mật khẩu của bạn để đảm bảo an toàn tài khoản</li>
        <li>📞 Liên hệ với chúng tôi ngay nếu bạn nghi ngờ tài khoản bị xâm nhập</li>
      </ul>
      
      <p>Email này được gửi đến địa chỉ email hiện tại của bạn để đảm bảo bạn được thông báo về mọi thay đổi quan trọng.</p>
      <p>Trân trọng,<br>Đội ngũ Live Chat</p>
    `;

    await this.sendMail(user.email, subject, html);
  }
}
