import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NodemailerEmailService } from './services/nodemailer-email.service';

export const EMAIL_SERVICE = 'EMAIL_SERVICE';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_SERVICE,
      useClass: NodemailerEmailService,
    },
  ],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
