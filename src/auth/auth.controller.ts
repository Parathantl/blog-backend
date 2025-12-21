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

    // Cookie settings for production (cross-domain)
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      secure: isProduction, // Required for sameSite: 'none'
    };

    res.cookie('IsAuthenticated', 'true', cookieOptions);
    res.cookie('Authentication', token, {
      ...cookieOptions,
      httpOnly: true,
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
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      sameSite: isProduction ? ('none' as const) : ('lax' as const),
      secure: isProduction,
    };

    res.clearCookie('Authentication', { ...cookieOptions, httpOnly: true });
    res.clearCookie('IsAuthenticated', cookieOptions);
    return res.status(200).send({
      success: true,
    });
  }
}
