import { Module } from '@nestjs/common';
import { PdfDevController } from '../controllers/pdf-dev.controller';
import { PdfService } from '../services/pdf.service';
import { PrismaModule } from './prisma.module';

/**
 * Dev-only module. Registered in AppModule only when NODE_ENV !== 'production'.
 * Provides dev/testing endpoints (e.g. PDF preview).
 */
@Module({
    imports: [PrismaModule],
    controllers: [PdfDevController],
    providers: [PdfService],
})
export class DevModule { }
