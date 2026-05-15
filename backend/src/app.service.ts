import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHello(): Promise<string> {
    const user = await this.prismaService.user.findMany();
    if (user) {
      return 'Erro';
    }
    return 'Hello World!';
  }
}
