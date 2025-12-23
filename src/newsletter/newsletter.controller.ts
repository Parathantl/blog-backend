import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @UsePipes(ValidationPipe)
  subscribe(@Body() subscribeDto: SubscribeDto) {
    return this.newsletterService.subscribe(subscribeDto);
  }

  @Get('verify')
  verifySubscription(@Query('token') token: string) {
    return this.newsletterService.verifySubscription(token);
  }

  @Post('unsubscribe')
  @UsePipes(ValidationPipe)
  unsubscribe(@Body() unsubscribeDto: UnsubscribeDto) {
    return this.newsletterService.unsubscribe(unsubscribeDto);
  }

  @Patch('update')
  @UsePipes(ValidationPipe)
  updateSubscription(@Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.newsletterService.updateSubscription(updateSubscriptionDto);
  }

  @Get('subscriber/:email')
  getSubscriber(@Param('email') email: string) {
    return this.newsletterService.getSubscriber(email);
  }

  // Admin endpoints - protected with JWT auth
  @Get('subscribers')
  @UseGuards(AuthGuard('jwt'))
  getAllSubscribers() {
    return this.newsletterService.getAllSubscribers();
  }

  @Get('subscribers/category/:id')
  @UseGuards(AuthGuard('jwt'))
  getSubscribersByCategory(@Param('id') id: string) {
    return this.newsletterService.getSubscribersByMasterCategory(+id);
  }
}
