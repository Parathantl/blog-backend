import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { CreateUserDto } from './dto/create-auth.dto';
import { CurrentUser } from './user-decorator';
import { User } from './entities/user.entity';
import { CurrentUserGuard } from './current-user-guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async userLogin(@Body() UserLoginDto, @Res() res: Response) {
    const { token, user } = await this.authService.login(UserLoginDto);

    res.cookie('IsAuthenticated', true, {
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    res.cookie('Authentication', token, {
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: 'lax',
    });

    return res.send({
      success: true,
      user,
    });
  }

  @Post('register')
  registerUser(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Get('authstatus')
  @UseGuards(CurrentUserGuard)
  authStatus(@CurrentUser() user: User) {
    return { status: !!user, user };
  }

  @Post('logout')
  logout(@Req() req: Request, @Res() res: Response) {
    res.clearCookie('Authentication');
    res.clearCookie('IsAuthenticated');
    return res.status(200).send({
      success: true,
    });
  }
}
