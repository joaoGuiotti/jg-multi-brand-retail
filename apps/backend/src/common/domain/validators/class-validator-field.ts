import { validateSync } from "class-validator";
import { IClassValidatorField } from "./class-validator-field.interface";
import { Notification } from "./notification";

export abstract class ClassValidatorFields implements IClassValidatorField {
    validate(notification: Notification, data: any, fields?: string[]): boolean {
        const errors = validateSync(data, {
            ... (fields ? { groups: fields } : {}),
            skipMissingProperties: true,
            skipUndefinedProperties: true,
            skipTypeCheck: true,
            validationError: { target: false, value: false },
        });

        if (errors.length) {
            for (const error of errors) {
                const key = error.property;
                Object.entries(error.constraints!).forEach(([_, value]) => {
                    notification.setError(value, key);
                });
            }
        }

        return !errors.length;
    }
}