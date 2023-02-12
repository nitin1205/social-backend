import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import crypto from 'crypto';
import moment from 'moment';
import publicIP from 'ip';

import { emailSchema, passwordSchema } from '@auth/schemes/password';
import { joiValidation } from '@root/shared/decorators/joi-validation.decorators';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error-handler';
import { config } from '@root/config';
import { forgotPasswordTemplate } from '@service/email/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { resetPasswordTemplate } from '@service/email/templates/reset-password/reset-password-template';

export class Password {
  @joiValidation(emailSchema)
  public async create(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser = authService.getAuthUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid Credentials');
    };

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    await authService.updatePasswordToken(`${(await existingUser)._id!}`, randomCharacters, Date.now() * 60 * 60 * 1000);

    const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate((await existingUser).username!, resetLink);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: email, subject: 'Reset your password'});
    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent'});
  };

  @joiValidation(passwordSchema)
  public async update(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Password do not match');
    };
    const existingUser = authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Rsest token has expired');
    };

    (await existingUser).password = password;
    (await existingUser).passwordResetExpires = undefined;
    (await existingUser).passwordResetToken = undefined;
    (await existingUser).save();

    const templateParams: IResetPasswordParams = {
      username: (await existingUser).username!,
      email: (await existingUser).email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD/MM/YYYY HH:mm')
    };

    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: (await existingUser).email, subject: 'Password reset confirmation'});
    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated'});
  };
};
