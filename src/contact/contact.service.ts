import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactMessage } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(ContactMessage)
    private contactRepository: Repository<ContactMessage>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async create(createContactDto: CreateContactDto): Promise<ContactMessage> {
    const contact = this.contactRepository.create(createContactDto);
    const savedContact = await this.contactRepository.save(contact);

    await this.sendEmails(createContactDto);

    return savedContact;
  }

  private async sendEmails(contactDto: CreateContactDto): Promise<void> {
    const contactEmail = this.configService.get('CONTACT_EMAIL');

    try {
      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: contactEmail,
        subject: `Portfolio Contact: ${contactDto.subject || 'New Message'}`,
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${contactDto.name}</p>
          <p><strong>Email:</strong> ${contactDto.email}</p>
          <p><strong>Subject:</strong> ${contactDto.subject || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${contactDto.message}</p>
        `,
      });

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_USER'),
        to: contactDto.email,
        subject: 'Thank you for contacting me',
        html: `
          <h2>Thank you for reaching out!</h2>
          <p>Hi ${contactDto.name},</p>
          <p>Thank you for your message. I'll get back to you as soon as possible.</p>
          <p>Best regards,<br/>Parathan</p>
        `,
      });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async findAll(): Promise<ContactMessage[]> {
    return await this.contactRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<ContactMessage> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact message with ID ${id} not found`);
    }
    return contact;
  }

  async markAsRead(id: number): Promise<ContactMessage> {
    const contact = await this.findOne(id);
    contact.isRead = true;
    return await this.contactRepository.save(contact);
  }

  async remove(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }
}
