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
   * 🔥 Calcul du SECRET_HASH
   */
  private calculateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', process.env.COGNITO_CLIENT_SECRET)
      .update(username + process.env.COGNITO_CLIENT_ID)
      .digest('base64');
  }

  /**
   * 🔥 1️⃣ Inscription d'un utilisateur
   */
  async signUp(
    email: string,
    password: string,
    role: string,
    firstName: string,
    lastName: string,
    username: string,
    agencyName?: string,
  ) {
    if (role === 'agency' && !agencyName) {
      throw new UnauthorizedException('Agency must provide an agencyName');
    }

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
      new CognitoUserAttribute({ Name: 'custom:firstName', Value: firstName }),
      new CognitoUserAttribute({ Name: 'custom:lastName', Value: lastName }),
      new CognitoUserAttribute({ Name: 'custom:username', Value: username }),
    ];

    if (role === 'agency') {
      attributeList.push(
        new CognitoUserAttribute({
          Name: 'custom:agencyName',
          Value: agencyName,
        }),
      );
    }

    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: attributeList,
      SecretHash: this.calculateSecretHash(email),
    };

    return new Promise((resolve, reject) => {
      this.cognitoIdentityServiceProvider.signUp(
        params,
        async (err, result) => {
          if (err) reject(new UnauthorizedException(err.message));
          else {
            try {
              await this.addUserToGroup(email, role);
              resolve({
                message: `User registered successfully in group ${role}. Please verify your email.`,
                userId: result?.UserSub,
              });
            } catch (error) {
              reject(new UnauthorizedException(error.message));
            }
          }
        },
      );
    });
  }

  /**
   * 🔥 2️⃣ Ajouter un utilisateur à un groupe Cognito
   */
  async addUserToGroup(email: string, role: string) {
    const params = {
      GroupName: role,
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    };

    return this.cognitoIdentityServiceProvider
      .adminAddUserToGroup(params)
      .promise();
  }

  /**
   * 🔥 3️⃣ Confirmer un compte utilisateur avec le code reçu par email
   */
  async confirmSignUp(username: string, code: string) {
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      SecretHash: this.calculateSecretHash(username),
    };

    try {
      await this.cognitoIdentityServiceProvider.confirmSignUp(params).promise();
      return { message: 'Email verified successfully.' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔥 4️⃣ Connexion (Login)
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
      const userGroups = await this.getUserGroups(email);

      return {
        accessToken: response.AuthenticationResult.AccessToken,
        idToken: response.AuthenticationResult.IdToken,
        refreshToken: response.AuthenticationResult.RefreshToken,
        groups: userGroups,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔥 5️⃣ Récupérer les groupes d'un utilisateur
   */
  async getUserGroups(email: string) {
    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
    };

    try {
      const response = await this.cognitoIdentityServiceProvider
        .adminListGroupsForUser(params)
        .promise();
      return response.Groups
        ? response.Groups.map((group) => group.GroupName)
        : [];
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to retrieve user groups: ${error.message}`,
      );
    }
  }

  /**
   * 🔥 6️⃣ Réinitialisation du mot de passe (envoi du code)
   */
  async forgotPassword(username: string) {
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      SecretHash: this.calculateSecretHash(username),
    };

    try {
      await this.cognitoIdentityServiceProvider
        .forgotPassword(params)
        .promise();
      return { message: 'Password reset code sent to email' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔥 7️⃣ Réinitialisation du mot de passe (nouveau mot de passe)
   */
  async resetPassword(username: string, code: string, newPassword: string) {
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: this.calculateSecretHash(username),
    };

    try {
      await this.cognitoIdentityServiceProvider
        .confirmForgotPassword(params)
        .promise();
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔥 8️⃣ Supprimer un compte utilisateur
   */
  async deleteAccount(username: string) {
    const params = {
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: username,
    };

    try {
      await this.cognitoIdentityServiceProvider
        .adminDeleteUser(params)
        .promise();
      return { message: 'User account deleted successfully' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔥 9️⃣ Déconnexion globale (invalidate token)
   */
  async logout(accessToken: string) {
    const params = {
      AccessToken: accessToken,
    };

    try {
      await this.cognitoIdentityServiceProvider.globalSignOut(params).promise();
      return { message: 'User successfully logged out.' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
