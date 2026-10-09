import { RefundType } from '../../../domain/entities/returns/return-order.entity';
import { ReturnItemCondition } from '../../../domain/entities/returns/return-item.entity';

export class ReturnItemDto {
  saleItemId?: string;
  productId: string;
  quantity: number;
  condition: ReturnItemCondition;
}

export class CreateReturnDto {
  saleId: string;
  refundType: RefundType;
  reason?: string;
  items: ReturnItemDto[];
}
