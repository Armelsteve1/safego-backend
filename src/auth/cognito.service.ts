import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CognitoUserPool,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';
import * as crypto from 'crypto';
@Injectable()
export class CognitoService {
  private userPool: CognitoUserPool;
  private cognitoIdentityServiceProvider: AWS.CognitoIdentityServiceProvider;
  constructor() {
    this.userPool = new CognitoUserPool({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      ClientId: process.env.COGNITO_CLIENT_ID,
    });

    this.cognitoIdentityServiceProvider =
      new AWS.CognitoIdentityServiceProvider({
        region: process.env.AWS_REGION,
      });
  }

  /**
   * 🔐 Generate Cognito Secret Hash (if needed)
   */
  private calculateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', process.env.COGNITO_CLIENT_SECRET)
      .update(username + process.env.COGNITO_CLIENT_ID)
      .digest('base64');
  }

  /**
   * 🛠️ Helper function to update user attributes
   */
  private updateUserAttributes(
    username: string,
    attributes: { Name: string; Value: string }[],
  ) {
    return this.cognitoIdentityServiceProvider
      .adminUpdateUserAttributes({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
        UserAttributes: attributes,
      })
      .promise()
      .then(() => ({ message: `User ${username} updated successfully.` }))
      .catch((error) => {
        throw new UnauthorizedException(`Update failed: ${error.message}`);
      });
  }

  /**
   * 📝 Register a new user (Driver/Agency needs validation)
   */
  async signUp(
    email: string,
    password: string,
    role: string,
    family_name?: string,
    given_name?: string,
    username?: string,
    agencyName?: string,
  ) {
    if (role === 'agency' && !agencyName) {
      throw new UnauthorizedException('Agency must provide an agencyName');
    }

    const attributes = [
      { Name: 'email', Value: email },
      { Name: 'custom:role', Value: role },
      { Name: 'custom:isValidated', Value: 'false' },
      { Name: 'custom:isVerified', Value: 'false' },
    ];

    if (family_name) {
      attributes.push({ Name: 'family_name', Value: family_name });
    }

    if (given_name) {
      attributes.push({ Name: 'given_name', Value: given_name });
    }

    if (role === 'agency' && (!agencyName || agencyName.trim() === '')) {
      throw new UnauthorizedException('Agency must provide an agencyName');
    } else if (role === 'agency') {
      attributes.push({ Name: 'custom:agencyName', Value: agencyName });
    }

    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username || email,
      Password: password,
      UserAttributes: attributes.map((attr) => new CognitoUserAttribute(attr)),
      SecretHash: this.calculateSecretHash(email),
    };

    try {
      const result = await this.cognitoIdentityServiceProvider
        .signUp(params)
        .promise();
      await this.addUserToGroup(email, role);
      return {
        message: `User registered in group ${role}. Please verify your email.`,
        userId: result?.UserSub,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔄 Add a user to a Cognito Group
   */
  async addUserToGroup(email: string, role: string) {
    return this.cognitoIdentityServiceProvider
      .adminAddUserToGroup({
        GroupName: role,
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
      })
      .promise();
  }

  /**
   * ✅ Confirm user email verification
   */
  async confirmSignUp(username: string, code: string) {
    return this.cognitoIdentityServiceProvider
      .confirmSignUp({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
        SecretHash: this.calculateSecretHash(username),
      })
      .promise()
      .then(() => ({ message: 'Email verified successfully.' }))
      .catch((error) => {
        throw new UnauthorizedException(error.message);
      });
  }

  /**
   * 🔑 User login with email/password
   */
  async signIn(email: string, password: string) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    };

    try {
      const response = await this.cognitoIdentityServiceProvider
        .initiateAuth(params)
        .promise();
      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        groups: await this.getUserGroups(email),
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔍 Get user's Cognito groups
   */
  async getUserGroups(email: string) {
    return this.cognitoIdentityServiceProvider
      .adminListGroupsForUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
      })
      .promise()
      .then(
        (response) => response.Groups?.map((group) => group.GroupName) || [],
      )
      .catch((error) => {
        throw new UnauthorizedException(
          `Failed to retrieve user groups: ${error.message}`,
        );
      });
  }

  /**
   * 🔄 Send a password reset request
   */
  async forgotPassword(username: string) {
    return this.cognitoIdentityServiceProvider
      .forgotPassword({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: username,
        SecretHash: this.calculateSecretHash(username),
      })
      .promise()
      .then(() => ({ message: 'Password reset code sent to email' }))
      .catch((error) => {
        throw new UnauthorizedException(error.message);
      });
  }

  /**
   * 🔄 Reset password with confirmation code
   */
  async resetPassword(username: string, code: string, newPassword: string) {
    return this.cognitoIdentityServiceProvider
      .confirmForgotPassword({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
        Password: newPassword,
        SecretHash: this.calculateSecretHash(username),
      })
      .promise()
      .then(() => ({ message: 'Password reset successfully' }))
      .catch((error) => {
        throw new UnauthorizedException(error.message);
      });
  }

  /**
   * ❌ Delete a user account
   */
  async deleteAccount(username: string) {
    return this.cognitoIdentityServiceProvider
      .adminDeleteUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username,
      })
      .promise()
      .then(() => ({ message: 'User account deleted successfully' }))
      .catch((error) => {
        throw new UnauthorizedException(error.message);
      });
  }

  /**
   * 🚪 User logout (global sign-out)
   */
  async logout(accessToken: string) {
    if (!accessToken) {
      throw new UnauthorizedException('No AccessToken provided');
    }

    try {
      await this.cognitoIdentityServiceProvider
        .globalSignOut({ AccessToken: accessToken })
        .promise();
      return { message: 'User successfully logged out.' };
    } catch (error) {
      console.error('Logout failed:', error.message);
      throw new UnauthorizedException(`Logout failed: ${error.message}`);
    }
  }

  /**
   * ✅ Verify a user (Admin only)
   */
  async verifyUser(username: string) {
    return this.updateUserAttributes(username, [
      { Name: 'custom:isVerified', Value: 'true' },
    ]);
  }

  /**
   * 🔍 List all users (Admin only)
   */
  async listUsers() {
    return this.cognitoIdentityServiceProvider
      .listUsers({ UserPoolId: process.env.COGNITO_USER_POOL_ID })
      .promise()
      .then((data) =>
        data.Users.map((user) => ({
          username: user.Username,
          email: user.Attributes.find((attr) => attr.Name === 'email')?.Value,
          role: user.Attributes.find((attr) => attr.Name === 'custom:role')
            ?.Value,
          isValidated: user.Attributes.find(
            (attr) => attr.Name === 'custom:isValidated',
          )?.Value,
          isVerified: user.Attributes.find(
            (attr) => attr.Name === 'custom:isVerified',
          )?.Value,
        })),
      )
      .catch((error) => {
        throw new UnauthorizedException(
          `Failed to list users: ${error.message}`,
        );
      });
  }

  /**
   * ✅ Validate a Driver/Agency (Admin only)
   */
  async validateUser(username: string) {
    return this.updateUserAttributes(username, [
      { Name: 'custom:isValidated', Value: 'true' },
    ]);
  }
  // fix todo
  async refreshToken(refreshToken: string, email: string) {
    const params = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    };

    try {
      const response = await this.cognitoIdentityServiceProvider
        .initiateAuth(params)
        .promise();

      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh token: ${error.message}`,
      );
    }
  }
  async listPendingValidationUsers() {
    return this.cognitoIdentityServiceProvider
      .listUsers({ UserPoolId: process.env.COGNITO_USER_POOL_ID })
      .promise()
      .then((data) =>
        data.Users.filter((user) =>
          user.Attributes.some(
            (attr) =>
              attr.Name === 'custom:isValidated' && attr.Value === 'false',
          ),
        ).map((user) => ({
          username: user.Username,
          email: user.Attributes.find((attr) => attr.Name === 'email')?.Value,
          role: user.Attributes.find((attr) => attr.Name === 'custom:role')
            ?.Value,
          isValidated: user.Attributes.find(
            (attr) => attr.Name === 'custom:isValidated',
          )?.Value,
          isVerified: user.Attributes.find(
            (attr) => attr.Name === 'custom:isVerified',
          )?.Value,
        })),
      )
      .catch((error) => {
        throw new UnauthorizedException(
          `Failed to list pending users: ${error.message}`,
        );
      });
  }
}
