import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Google OAuth Strategy specifically for linking accounts
 * This strategy is used when a logged-in user wants to link their Google account
 * It doesn't validate/create a user, just returns the Google profile data
 */
@Injectable()
export class GoogleLinkStrategy extends PassportStrategy(
  Strategy,
  'google-link'
) {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') as string,
      callbackURL: `${configService.get<string>('API_BASE_URL')}/auth/link-google/callback`,
      scope: ['email', 'profile'],
      passReqToCallback: true, // This allows us to access req.query.state
    });
  }

  // Override authenticate to pass the state parameter from query to Google OAuth
  authenticate(req: any, options?: any) {
    const state = req.query.state;
    if (state) {
      options = options || {};
      options.state = state;
    }
    super.authenticate(req, options);
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback
  ): Promise<any> {
    const { id, displayName, emails, photos } = profile;

    if (!emails || emails.length === 0) {
      return done(new Error('No email associated with this account!'), false);
    }

    // Return the Google profile data along with the state parameter
    // The state will be available in req.query.state in the callback
    const googleProfile = {
      provider: 'google',
      providerId: id,
      email: emails[0].value,
      name: displayName,
      avatarUrl: photos && photos.length > 0 ? photos[0].value : '',
      state: req.query.state, // This will be the state returned from Google
    };

    done(null, googleProfile);
  }
}
