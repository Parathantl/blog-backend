import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  // Public endpoints

  @Post('subscribe')
  @UsePipes(ValidationPipe)
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Get('verify/:verificationToken')
  verify(@Param('verificationToken') verificationToken: string) {
    return this.newsletterService.verify(verificationToken);
  }

  @Get('preferences/:preferenceToken')
  getPreferences(@Param('preferenceToken') preferenceToken: string) {
    return this.newsletterService.getPreferences(preferenceToken);
  }

  @Put('preferences/:preferenceToken')
  @UsePipes(ValidationPipe)
  updatePreferences(
    @Param('preferenceToken') preferenceToken: string,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    return this.newsletterService.updatePreferences(
      preferenceToken,
      updatePreferencesDto,
    );
  }

  @Delete('unsubscribe/:preferenceToken')
  unsubscribe(@Param('preferenceToken') preferenceToken: string) {
    return this.newsletterService.unsubscribe(preferenceToken);
  }

  // Admin endpoints - protected with JWT auth

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  getSubscriberStats() {
    return this.newsletterService.getSubscriberStats();
  }

  @Get('subscribers')
  @UseGuards(AuthGuard('jwt'))
  getAllSubscribers() {
    return this.newsletterService.getAllSubscribers();
  }

  @Get('subscribers/category/:id')
  @UseGuards(AuthGuard('jwt'))
  getSubscribersByCategory(@Param('id') id: string) {
    return this.newsletterService.getSubscribersByCategory(+id);
  }
}
