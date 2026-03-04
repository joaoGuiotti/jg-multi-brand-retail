import { ClassValidatorFields } from "@common/domain/validators/class-validator-field";
import { Notification } from "@common/domain/validators/notification";
import { IsBoolean, MaxLength } from "class-validator";
import { Customer } from "./customer.entity";

export class CustomerRules {
    @MaxLength(100, { groups: ['firstName'] })
    firstName: string;

    @MaxLength(100, { groups: ['lastName'] })
    lastName: string;

    @MaxLength(100, { groups: ['phone'] })
    phone: string;

    @MaxLength(100, { groups: ['email'] })
    email: string;

    @IsBoolean({ groups: ['isActive'] })
    isActive: boolean;

    constructor(customer: Customer) {
        this.firstName = customer.firstName;
        this.lastName = customer.lastName;
        this.phone = customer.phone;
        this.email = customer.email;
        this.isActive = customer.isActive;
    }
}

export class CustomerValidator extends ClassValidatorFields {
    validate(notification: Notification, data: any, fields?: string[]): boolean {
        const rules = new CustomerRules(data);
        const newFields = fields?.length ? fields : Object.keys(rules);
        return super.validate(notification, rules, fields);
    }
}

export class CustomerValidatorFactory {
    static create() {
        return new CustomerValidator();
    }
}
