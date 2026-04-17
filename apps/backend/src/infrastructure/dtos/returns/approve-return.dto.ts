import { ReturnStatus } from '../../../domain/entities/returns/return-order.entity';

export class ApproveReturnDto {
  status: ReturnStatus;
  reason?: string;
}
