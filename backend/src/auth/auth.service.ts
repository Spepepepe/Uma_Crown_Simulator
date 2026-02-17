import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  getUserData(userId: string) {
    return { user_id: userId };
  }
}
