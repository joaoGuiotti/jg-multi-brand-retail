import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface TenantProps {
  name: string;
  slug: string;
  logoUrl?: string | null;
  settings?: any;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: TenantProps, id?: UniqueEntityID): Tenant {
    const tenant = new Tenant(
      {
        ...props,
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return tenant;
  }

  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get logoUrl(): string | null | undefined {
    return this.props.logoUrl;
  }
  get settings(): any {
    return this.props.settings;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  public updateSettings(settings: any): void {
    this.props.settings = settings;
    this.props.updatedAt = new Date();
  }
}
