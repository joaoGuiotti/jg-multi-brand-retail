import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { NotificationType } from '../../../domain/entities/notifications/notification.entity';

export class UpdatePreferenceDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsBoolean()
  @IsNotEmpty()
  enabled: boolean;

  @IsBoolean()
  @IsNotEmpty()
  sound: boolean;
}
