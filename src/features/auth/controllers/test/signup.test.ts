import { Request, Response } from 'express';

import * as cloudinaryUploads from '@global/helpers/cloudinary-upload';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { SignUp } from '../signup';
import { CustomError } from '@global/helpers/error-handler';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';

jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@global/helpers/cloudinary-upload');

describe('SignUp', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if username is not available', () => {
    const request: Request = authMockRequest({}, {
      username: '',
      email: 'slim@gmail.com',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();

    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Username is a required field');
    });
  });

  it('should throw an error if username is less than minimum length', () =>{
    const request: Request = authMockRequest({}, {
      username: 'sl',
      email: 'slim@gmail.com',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid username');
    });
  });

  it('should throw an error if username is greater than maximum length', () =>{
    const request: Request = authMockRequest({}, {
      username: 'TheRealSlimShady',
      email: 'slim@gmail.com',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid username');
    });
  });

  it('should throw an error if email is not valid', () =>{
    const request: Request = authMockRequest({}, {
      username: 'slim',
      email: 'not valid',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Email must be valid');
    });
  });

  it('should throw an error if email is not available', () =>{
    const request: Request = authMockRequest({}, {
      username: 'slim',
      email: '',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Email is a required field');
    });
  });

  it('should throw an error if password is not available', () =>{
    const request: Request = authMockRequest({}, {
      username: 'slim',
      email: 'slim@gmail.com',
      password: 'qwerty',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Password is a required field');
    });
  });

  it('should throw an error if password length is less than minimum length', () =>{
    const request: Request = authMockRequest({}, {
      username: 'slim',
      email: 'slim@gmail.com',
      password: 'qw',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid password');
    });
  });

  it('should throw an error if password length is greater than maximum length', () =>{
    const request: Request = authMockRequest({}, {
      username: 'slim',
      email: 'slim@gmail.com',
      password: 'qwertyuiop',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('Invalid password');
    });
  });

  it('should throw unathorized error if user is already exists', () => {
    const request: Request = authMockRequest({}, {
      username: 'Slim',
      email: 'slim@gmail.com',
      password: 'qwerty1',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);
    SignUp.prototype.create(request, response).catch((error: CustomError) => {
      expect(error.statusCode).toEqual(400);
      expect(error.serializeErrors().messsage).toEqual('User already exists');
    });
  });

  it('should set session data for valid credentilas and send correct json response', async () => {
    const request: Request = authMockRequest({}, {
      username: 'nitinS',
      email: 'nitin@gmail.com',
      password: 'qwerty1',
      avatarColor: 'red',
      avatarImage: 'data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=='
    }) as Request;
    const response: Response = authMockResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any);
    const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCahche');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cloudinaryUploads, 'uploads').mockImplementation((): any => Promise.resolve({ version: '123345', public_id: '123456' }));
    await SignUp.prototype.create(request, response);
    expect(request.session?.jwt).toBeDefined();
    expect(response.json).toHaveBeenCalledWith({
      message: 'user created successfully',
      user: userSpy.mock.calls[0][2],
      token: request.session?.jwt
    });
  });
});

