
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, Project, Invitation } from '../database/entities';
import { ProjectRole } from '@live-chat/shared-types';

@Injectable()
export class EmailTemplateService {
  constructor(private readonly configService: ConfigService) {}

  getUserConfirmationTemplate(user: User, token: string) {
    const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
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

  getPasswordResetTemplate(user: User, token: string) {
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
    return { subject, html };
  }

  getEmailChangeVerificationTemplate(user: User, newEmail: string, token: string) {
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
    return { subject, html };
  }

  getEmailChangeConfirmationTemplate(oldEmail: string, newEmail: string, userName: string) {
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
    return { subject, html };
  }

  getEmailChangeNotificationTemplate(user: User, newEmail: string) {
    const subject = '⚠️ Cảnh báo: Yêu cầu thay đổi email - Live Chat';
    const html = `
      <p>Chào ${user.fullName},</p>
      <p>�� <strong>Chúng tôi nhận được yêu cầu thay đổi địa chỉ email</strong> của tài khoản Live Chat của bạn:</p>
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

  getInvitationTemplate(invitation: Invitation, project: Project, existingUser?: User) {
    const isNewUser = !existingUser;
    let invitationUrl: string;
    let actionText: string;
    let instructionText: string;

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
}
