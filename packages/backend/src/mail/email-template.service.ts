
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, Project, Invitation } from '../database/entities';
import { ProjectRole } from '@live-chat/shared-types';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  getUserConfirmationTemplate(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    
    if (user.language === 'vi') {
      const subject = 'Chào mừng bạn đến với Live Chat! Vui lòng xác thực email của bạn';
      const html = `
        <p>Chào ${user.fullName},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Live Chat. Vui lòng nhấp vào liên kết bên dưới để xác thực địa chỉ email của bạn:</p>
        <a href="${url}">Xác thực Email</a>
        <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ Live Chat</p>
      `;
      return { subject, html };
    }

    const subject = 'Welcome to Live Chat! Please verify your email';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>Thank you for registering with Live Chat. Please click the link below to verify your email address:</p>
      <a href="${url}">Verify Email</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not register for this account, please ignore this email.</p>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html };
  }

  getPasswordResetTemplate(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    
    if (user.language === 'vi') {
      const subject = 'Đặt lại mật khẩu tài khoản Live Chat';
      const html = `
        <p>Chào ${user.fullName},</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Live Chat của mình. Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
        <a href="${url}">Đặt lại mật khẩu</a>
        <p>Liên kết này sẽ hết hạn sau 15 phút.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
        <p>Trân trọng,<br>Đội ngũ Live Chat</p>
      `;
      return { subject, html };
    }

    const subject = 'Reset your Live Chat password';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>You requested a password reset for your Live Chat account. Please click the link below to reset your password:</p>
      <a href="${url}">Reset Password</a>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html };
  }

  getEmailChangeVerificationTemplate(user: User, newEmail: string, token: string) {
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
    const url = `${apiBaseUrl}/auth/verify-email-change?token=${token}`;
    
    if (user.language === 'vi') {
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
      return { subject, html };
    }

    const subject = 'Verify Email Change - Live Chat';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>You requested to change your Live Chat account email from <strong>${user.email}</strong> to <strong>${newEmail}</strong>.</p>
      <p>To complete this change, please click the link below:</p>
      <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">Verify Email Change</a>
      <p>Or copy and paste the following link into your browser:</p>
      <p>${url}</p>
      <p>This link will expire in 24 hours.</p>
      <p><strong>⚠️ Important Security Notes:</strong></p>
      <ul>
        <li><strong>After verification, you will be LOGGED OUT IMMEDIATELY from all devices.</strong></li>
        <li>This includes: computers, phones, tablets, and any other logged-in devices.</li>
        <li>You will need to log in again with your new email: <strong>${newEmail}</strong></li>
        <li>If you have a linked Google account, it will be automatically unlinked as the email no longer matches.</li>
      </ul>
      <p><strong>If you did not request this change:</strong></p>
      <ul>
        <li>⛔ DO NOT click the verification link</li>
        <li>🔒 Change your account password immediately</li>
        <li>📧 Contact us for support</li>
      </ul>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html };
  }

  getEmailChangeConfirmationTemplate(user: User, oldEmail: string, newEmail: string) {
    if (user.language === 'vi') {
      const subject = '✅ Xác nhận: Email đã được thay đổi - Live Chat';
      const html = `
        <p>Chào ${user.fullName},</p>
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
      return { subject, html };
    }

    const subject = '✅ Confirmed: Email has been changed - Live Chat';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>✅ <strong>Your Live Chat account email has been successfully changed.</strong></p>
      
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>📧 Change Details:</strong></p>
        <ul style="margin: 8px 0;">
          <li>Old Email: <strong>${oldEmail}</strong></li>
          <li>New Email: <strong>${newEmail}</strong></li>
          <li>Time: ${new Date().toLocaleString()}</li>
        </ul>
      </div>

      <p><strong>🔒 Security changes applied:</strong></p>
      <ul>
        <li>✅ All active sessions have been logged out from all devices</li>
        <li>✅ All linked accounts (Google, etc.) have been unlinked</li>
        <li>✅ New login email: <strong>${newEmail}</strong></li>
      </ul>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>⚠️ IMPORTANT:</strong></p>
        <p style="margin: 8px 0 0 0;">If you DID NOT make this change, please contact us <strong>IMMEDIATELY</strong> to recover your account.</p>
      </div>

      <p>This email was sent to your old email address to confirm the completion of the change.</p>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html };
  }

  getEmailChangeNotificationTemplate(user: User, newEmail: string) {
    if (user.language === 'vi') {
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
      return { subject, html };
    }

    const subject = '⚠️ Alert: Email Change Request - Live Chat';
    const html = `
      <p>Hi ${user.fullName},</p>
      <p>🔔 <strong>We received a request to change your Live Chat account email</strong>:</p>
      <ul>
        <li>📧 Current Email: <strong>${user.email}</strong></li>
        <li>📧 New Email: <strong>${newEmail}</strong></li>
        <li>🕐 Time: ${new Date().toLocaleString()}</li>
      </ul>
      <p>A confirmation email has been sent to the new email address. Your email will only be changed after verification from the new address.</p>
      
      <p><strong>⚠️ What happens when email is changed:</strong></p>
      <ul>
        <li>🚪 You will be logged out from <strong>ALL</strong> devices (computers, phones, tablets, etc.)</li>
        <li>🔗 All linked accounts (Google, etc.) will be automatically unlinked</li>
        <li>🔑 You will need to log in again with the new email</li>
      </ul>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 16px 0;">
        <p style="margin: 0;"><strong>🚨 IF YOU DID NOT REQUEST THIS:</strong></p>
      </div>
      <ul>
        <li>⛔ Log in to your account and <strong>CANCEL THE REQUEST</strong> immediately</li>
        <li>🔒 Change your password to secure your account</li>
        <li>📞 Contact us immediately if you suspect your account is compromised</li>
      </ul>
      
      <p>This email is sent to your current email address to ensure you are notified of any important changes.</p>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html };
  }

  getInvitationTemplate(invitation: Invitation, project: Project, existingUser?: User) {
    const isNewUser = !existingUser;
    
    // Check language from existing user or default to English. 
    // Invitation typically doesn't have language info unless we store it, defaulting to EN for new users is standard unless we infer from browser/request.
    const language = existingUser?.language || 'en';

    let invitationUrl: string;
    let actionText: string;
    let instructionText: string;

    if (language === 'vi') {
       if (isNewUser) {
        invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/register?invitation_token=${invitation.token}`;
        actionText = 'Đăng ký và tham gia';
        instructionText = 'Bạn cần đăng ký tài khoản để tham gia dự án này. Nhấp vào liên kết bên dưới để đăng ký:';
      } else {
        invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invitation?token=${invitation.token}`;
        actionText = 'Chấp nhận lời mời';
        instructionText = 'Nhấp vào liên kết bên dưới để chấp nhận lời mời:';
      }

      const subject = `Lời mời tham gia dự án "${project.name}" với vai trò ${invitation.role === ProjectRole.AGENT ? 'Agent' : invitation.role}`;
      const html = `
        <p>Xin chào,</p>
        <p>Bạn đã được mời tham gia dự án <strong>${project.name}</strong> với vai trò <strong>${invitation.role === ProjectRole.AGENT ? 'Agent' : invitation.role}</strong>.</p>
        <p>${instructionText}</p>
        <a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">${actionText}</a>
        <p>Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
        <p>${invitationUrl}</p>
        <p>Lời mời này sẽ hết hạn sau 7 ngày.</p>
        <p>Nếu bạn không muốn tham gia dự án này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ Live Chat</p>
      `;
      return { subject, html, invitationUrl };
    }

    // Default English
    if (isNewUser) {
      invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/register?invitation_token=${invitation.token}`;
      actionText = 'Register and Join';
      instructionText = 'You need to register an account to join this project. Click the link below to register:';
    } else {
      invitationUrl = `${this.configService.get<string>('FRONTEND_URL')}/accept-invitation?token=${invitation.token}`;
      actionText = 'Accept Invitation';
      instructionText = 'Click the link below to accept the invitation:';
    }

    const subject = `Invitation to join project "${project.name}" as ${invitation.role === ProjectRole.AGENT ? 'Agent' : invitation.role}`;
    const html = `
      <p>Hi,</p>
      <p>You have been invited to join project <strong>${project.name}</strong> as <strong>${invitation.role === ProjectRole.AGENT ? 'Agent' : invitation.role}</strong>.</p>
      <p>${instructionText}</p>
      <a href="${invitationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">${actionText}</a>
      <p>Or copy and paste the following link into your browser:</p>
      <p>${invitationUrl}</p>
      <p>This invitation will expire in 7 days.</p>
      <p>If you do not want to join this project, please ignore this email.</p>
      <p>Best regards,<br>Live Chat Team</p>
    `;
    return { subject, html, invitationUrl };
  }
}
