import { Request, Response } from 'express';
import JWT from 'jsonwebtoken';
import HTTP_STATUS from 'http-status-codes';

import { config } from '@root/config';
import { joiValidation } from '@root/shared/decorators/joi-validation.decorators';
import { authService } from '@service/db/auth.service';
import { loginSchema } from '@auth/schemes/signin';
import { BadRequestError } from '@global/helpers/error-handler';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
// import { IUserDocument } from '@user/interfaces/user.interface';
// import { userService } from '@service/db/user.service';
// import { emailQueue } from '@service/queues/email.queue';
// import moment from 'moment';
// import publicIp from 'ip';
// import { IResetPasswordParams } from '@user/interfaces/user.interface';
// import { resetPasswordTemplate } from '@service/email/templates/reset-password/reset-password-template';

export class SignIn {
  @joiValidation(loginSchema)
  public async read(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDocument = await authService.getAuthUserByUsername(username);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordMatch) {
      throw new BadRequestError('Invalid Credentials');
    }
    // const user: IUserDocument = await userService.getUserByAuthId(`${existingUser._id}`);
    const userJwt: string = JWT.sign(
      {
        userId: existingUser._id, // change later
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.JWT_TOKEN!
    );
    // const templateParams: IResetPasswordParams = {
    //   username: existingUser.username,
    //   email: existingUser.email,
    //   ipaddress: publicIp.address(),
    //   date: moment().format('DD/MM/YYYY HH:mm')
    // };
    // const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(templateParams);
    // emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: 'vortechcorp@gmail.com', subject: 'Password reset conformation'});


    req.session = { jwt: userJwt };
    // const userDocument: IUserDocument = {
    //   ...user,
    //   authId: existingUser._id,
    //   uId: existingUser.uId,
    //   username: existingUser.username,
    //   email: existingUser.email,
    //   avatarColor: existingUser.avatarColor,
    //   createdAt: existingUser.createdAt
    // } as IUserDocument;
    res.status(HTTP_STATUS.OK).json({ message: 'User login successfully', user: existingUser, token: userJwt });
  }
}
