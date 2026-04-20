import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { StockChangedEvent } from '../../events/inventory/stock-changed.event';

export interface ProductProps {
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  costPrice: number;
  salePrice: number;
  margin: number;
  stockQuantity: number;
  unit: string;
  active: boolean;
  metadata?: any | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ProductProps, id?: UniqueEntityID): Product {
    const product = new Product(
      {
        ...props,
        stockQuantity: props.stockQuantity ?? 0,
        unit: props.unit ?? 'UN',
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return product;
  }

  get name(): string {
    return this.props.name;
  }
  get description(): string | undefined | null {
    return this.props.description;
  }
  get sku(): string {
    return this.props.sku;
  }
  get barcode(): string | undefined | null {
    return this.props.barcode;
  }
  get categoryId(): string | undefined | null {
    return this.props.categoryId;
  }
  get brandId(): string | undefined | null {
    return this.props.brandId;
  }
  get supplierId(): string | undefined | null {
    return this.props.supplierId;
  }
  get costPrice(): number {
    return this.props.costPrice;
  }
  get salePrice(): number {
    return this.props.salePrice;
  }
  get margin(): number {
    return this.props.margin;
  }
  get stockQuantity(): number {
    return this.props.stockQuantity;
  }
  get unit(): string {
    return this.props.unit;
  }
  get active(): boolean {
    return this.props.active;
  }
  get metadata(): any | undefined | null {
    return this.props.metadata;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public updateStock(quantity: number, tenantId: string): void {
    const oldQuantity = this.props.stockQuantity;
    const adjustment = quantity - oldQuantity;
    this.props.stockQuantity = quantity;
    this.props.updatedAt = new Date();
    
    this.applyEvent(
      new StockChangedEvent(this, adjustment, 'MANUAL', tenantId)
    );
  }

  public adjustStock(adjustment: number, tenantId: string, movementType: string): void {
    this.props.stockQuantity += adjustment;
    this.props.updatedAt = new Date();
    
    this.applyEvent(
      new StockChangedEvent(this, adjustment, movementType, tenantId)
    );
  }

  public updatePrices(costPrice: number, salePrice: number): void {
    this.props.costPrice = costPrice;
    this.props.salePrice = salePrice;
    this.props.margin = this.calculateMargin(costPrice, salePrice);
    this.props.updatedAt = new Date();
  }

  private calculateMargin(costPrice: number, salePrice: number): number {
    if (costPrice === 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }

  toJson() {
    return {
      id: this.id.toString(),
      ...this.props,
    };
  }
}
