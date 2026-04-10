import { Notification } from './notification';

export type FieldsErros =
  | {
      [field: string]: string[];
    }
  | string;

export interface IClassValidatorField {
  validate(notification: Notification, data: any, fields: string[]): boolean;
}
