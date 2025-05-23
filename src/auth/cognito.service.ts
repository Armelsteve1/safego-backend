import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
  AdminDeleteUserCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  AdminListGroupsForUserCommand,
  ForgotPasswordCommand,
  SignUpCommand,
  ConfirmForgotPasswordCommand,
  InitiateAuthCommand,
  // ResendConfirmationCodeCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class CognitoService {
  private cognitoClient: CognitoIdentityProviderClient;

  constructor() {
    this.cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  async getUserFromCognito(accessToken: string) {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: accessToken,
      });

      const user = await this.cognitoClient.send(command);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Unable to fetch user from Cognito');
    }
  }
  async getUserNameFromCognito(accessToken: string) {
    try {
      const decoded = jwt.decode(accessToken);
      const sub = decoded?.sub;
      if (!sub) {
        throw new UnauthorizedException('Token invalide (sub manquant)');
      }
      const command = new AdminGetUserCommand({
        UserPoolId: String(process.env.COGNITO_USER_POOL_ID),
        Username: String(sub),
      });
      const user = await this.cognitoClient.send(command);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Unable to fetch user from Cognito');
    }
  }

  /**
   * 🔐 Générer le Secret Hash pour Cognito
   */
  private calculateSecretHash(username: string): string {
    return crypto
      .createHmac('sha256', process.env.COGNITO_CLIENT_SECRET!)
      .update(username + process.env.COGNITO_CLIENT_ID)
      .digest('base64');
  }

  /**
   * 🔄 Ajouter un utilisateur à un groupe
   */
  async addUserToGroup(email: string, role: string) {
    const command = new AdminAddUserToGroupCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      GroupName: role,
      Username: email,
    });

    await this.cognitoClient.send(command);
  }

  /**
   * ✅ Inscription d'un utilisateur
   */
  async signUp(
    email: string,
    password: string,
    role: string,
    family_name?: string,
    given_name?: string,
    agencyName?: string,
  ) {
    if (!role) {
      throw new UnauthorizedException('Role is required and cannot be null.');
    }

    if (role === 'agency' && !agencyName) {
      throw new UnauthorizedException('Agency must provide an agencyName.');
    }

    const userAttributes = [
      { Name: 'email', Value: email },
      { Name: 'custom:role', Value: role },
      { Name: 'custom:isValidated', Value: 'false' },
      { Name: 'custom:isVerified', Value: 'false' },
    ];

    if (family_name)
      userAttributes.push({ Name: 'family_name', Value: family_name });
    if (given_name)
      userAttributes.push({ Name: 'given_name', Value: given_name });
    if (role === 'agency')
      userAttributes.push({ Name: 'custom:agencyName', Value: agencyName });

    try {
      const command = new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID!,
        Username: email,
        Password: password,
        UserAttributes: userAttributes,
        SecretHash: this.calculateSecretHash(email),
      });

      const result = await this.cognitoClient.send(command);
      await this.addUserToGroup(email, role);

      return {
        message:
          'User registered successfully. Please verify your email with the code sent.',
        userId: result?.UserSub,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔑 Connexion de l'utilisateur
   */
  async signIn(email: string, password: string) {
    const command = new AdminInitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: this.calculateSecretHash(email),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);
      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
        groups: await this.getUserGroups(email),
      };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🔍 Obtenir les groupes d'un utilisateur
   */
  async getUserGroups(email: string) {
    const command = new AdminListGroupsForUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: email,
    });

    try {
      const response = await this.cognitoClient.send(command);
      return response.Groups?.map((group) => group.GroupName) || [];
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to retrieve user groups: ${error.message}`,
      );
    }
  }

  /**
   * ✅ Vérification de l'utilisateur
   */
  async confirmSignUp(username: string, code: string) {
    const command = new ConfirmSignUpCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: username,
      ConfirmationCode: code,
      SecretHash: this.calculateSecretHash(username),
    });

    try {
      await this.cognitoClient.send(command);
      return { message: 'Email verified successfully.' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  /**
   * 🚪 Déconnexion globale de l'utilisateur
   */
  async logout(accessToken: string) {
    if (!accessToken)
      throw new UnauthorizedException('No AccessToken provided');

    try {
      const command = new GlobalSignOutCommand({ AccessToken: accessToken });
      await this.cognitoClient.send(command);
      return { message: 'User successfully logged out.' };
    } catch (error) {
      throw new UnauthorizedException(`Logout failed: ${error.message}`);
    }
  }

  /**
   * 🔄 Mettre à jour les attributs utilisateur
   */
  async updateUserAttributes(
    username: string,
    attributes: { Name: string; Value: string }[],
  ) {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
      UserAttributes: attributes,
    });

    try {
      await this.cognitoClient.send(command);
      return { message: `User ${username} updated successfully.` };
    } catch (error) {
      throw new UnauthorizedException(`Update failed: ${error.message}`);
    }
  }
  /**
   * 🔄 Send a password reset request
   */
  async forgotPassword(username: string) {
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: username,
      SecretHash: this.calculateSecretHash(username),
    });

    try {
      await this.cognitoClient.send(command);
      return { message: 'Password reset code sent to email' };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to send password reset code: ${error.message}`,
      );
    }
  }

  /**
   * 🔄 Reset password with confirmation code
   */
  async resetPassword(username: string, code: string, newPassword: string) {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID!,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: this.calculateSecretHash(username),
    });

    try {
      await this.cognitoClient.send(command);
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to reset password: ${error.message}`,
      );
    }
  }
  /**
   * ❌ Supprimer un utilisateur
   */
  async deleteAccount(username: string) {
    const command = new AdminDeleteUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
    });

    try {
      await this.cognitoClient.send(command);
      return { message: 'User account deleted successfully' };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async refreshToken(refreshToken: string, username: string) {
    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID!,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: this.calculateSecretHash(username),
      },
    });

    try {
      const response = await this.cognitoClient.send(command);

      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        expiresIn: response.AuthenticationResult?.ExpiresIn,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to refresh token: ${error.message}`,
      );
    }
  }

  /**
   * 🔍 Lister les utilisateurs en attente de validation (Admin)
   */
  async listPendingValidationUsers() {
    const command = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    });

    try {
      const data = await this.cognitoClient.send(command);
      return data.Users?.filter((user) =>
        user.Attributes?.some(
          (attr) =>
            attr.Name === 'custom:isValidated' && attr.Value === 'false',
        ),
      ).map((user) => ({
        username: user.Username,
        email: user.Attributes?.find((attr) => attr.Name === 'email')?.Value,
        role: user.Attributes?.find((attr) => attr.Name === 'custom:role')
          ?.Value,
        isValidated: user.Attributes?.find(
          (attr) => attr.Name === 'custom:isValidated',
        )?.Value,
        isVerified: user.Attributes?.find(
          (attr) => attr.Name === 'custom:isVerified',
        )?.Value,
      }));
    } catch (error) {
      throw new UnauthorizedException(
        `Failed to list pending users: ${error.message}`,
      );
    }
  }

  /**
   * ✅ Valider un compte Driver ou Agency (Admin uniquement)
   */
  async validateUser(username: string) {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
      UserAttributes: [{ Name: 'custom:isValidated', Value: 'true' }],
    });

    try {
      await this.cognitoClient.send(command);
      return { message: `User ${username} successfully validated.` };
    } catch (error) {
      throw new UnauthorizedException(`Validation failed: ${error.message}`);
    }
  }

  /**
   * ✅ Vérifier un utilisateur (Admin uniquement)
   */
  async verifyUser(username: string) {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
      UserAttributes: [{ Name: 'custom:isVerified', Value: 'true' }],
    });

    try {
      await this.cognitoClient.send(command);
      return { message: `User ${username} successfully verified.` };
    } catch (error) {
      throw new UnauthorizedException(`Verification failed: ${error.message}`);
    }
  }

  // async resendConfirmationCode(username: string) {
  //   try {
  //     const command = new ResendConfirmationCodeCommand({
  //       ClientId: process.env.COGNITO_CLIENT_ID!,
  //       Username: username,
  //       SecretHash: this.calculateSecretHash(username),
  //     });

  //     await this.cognitoClient.send(command);
  //     return { message: "A new verification code has been sent to your email." };
  //   } catch (error) {
  //     throw new UnauthorizedException(error.message);
  //   }
  // }
  /**
   * 🔍 Lister tous les utilisateurs (Admin uniquement)
   */
  async listUsers() {
    const command = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
    });

    try {
      const response = await this.cognitoClient.send(command);
      return response.Users?.map((user) => ({
        username: user.Username,
        email: user.Attributes?.find((attr) => attr.Name === 'email')?.Value,
        role: user.Attributes?.find((attr) => attr.Name === 'custom:role')
          ?.Value,
        isValidated: user.Attributes?.find(
          (attr) => attr.Name === 'custom:isValidated',
        )?.Value,
        isVerified: user.Attributes?.find(
          (attr) => attr.Name === 'custom:isVerified',
        )?.Value,
      }));
    } catch (error) {
      throw new UnauthorizedException(`Failed to list users: ${error.message}`);
    }
  }
  /**
   * 🔍 Récupérer les informations de l'utilisateur connecté
   */
  async getUserInfo(accessToken: string) {
    try {
      const decoded = jwt.decode(accessToken) as { sub?: string };
      const username = decoded?.sub;

      if (!username) {
        throw new UnauthorizedException('Token invalide');
      }

      const command = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: username,
      });

      const { UserAttributes } = await this.cognitoClient.send(command);
      const user = (UserAttributes || []).reduce(
        (acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        },
        {} as Record<string, string>,
      );

      return user;
    } catch (error) {
      throw new UnauthorizedException("Impossible de récupérer l'utilisateur.");
    }
  }

  /**
   * 🔄 Modifier les informations de l'utilisateur
   */
  async updateUserInfo(
    token: string,
    attributes: { Name: string; Value: string }[],
  ) {
    try {
      const decoded = jwt.decode(token) as { sub?: string };

      const username = decoded?.sub;
      if (!username) {
        throw new UnauthorizedException(
          'Token invalide : identifiant manquant',
        );
      }

      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: username,
        UserAttributes: attributes,
      });

      await this.cognitoClient.send(command);
      return { message: `Utilisateur ${username} mis à jour avec succès.` };
    } catch (error) {
      throw new UnauthorizedException(
        `Mise à jour impossible : ${error.message}`,
      );
    }
  }

  async updateProfilePicture(username: string, pictureUrl: string) {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      Username: username,
      UserAttributes: [
        {
          Name: 'picture',
          Value: pictureUrl,
        },
      ],
    });

    try {
      await this.cognitoClient.send(command);
      return {
        message: 'Photo de profil mise à jour avec succès',
        picture: pictureUrl,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Échec mise à jour photo : ${error.message}`,
      );
    }
  }
}
