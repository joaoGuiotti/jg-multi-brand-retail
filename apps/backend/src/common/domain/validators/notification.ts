export class Notification {
  public errors = new Map<string, string[] | string>();

  addError(error: string, key?: string) {
    if (key) {
      const errors = this.errors.get(key) ?? ([] as string[]);
      this.errors.set(key, errors);
    } else {
      this.errors.set(error, error);
    }
  }

  setError(error: string | string[], key?: string) {
    if (key) {
      this.errors.set(key, Array.isArray(error) ? error : [error]);
    } else {
      if (Array.isArray(error)) {
        error.forEach((value) => {
          this.errors.set(value, value);
        });
        return;
      }
      this.errors.set(error, error);
    }
  }

  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  messages(key?: string) {
    if (key) {
      return this.errors.get(key);
    }
    return Array.from(this.errors.values()).flat();
  }

  copyErrors(notification: Notification) {
    notification.errors.forEach((value, key) => {
      this.setError(value, key);
    });
  }

  toJSON() {
    const errors: Array<string | { [key: string]: string[] }> = [];
    this.errors.forEach((value, key) => {
      if (typeof value === 'string') {
        errors.push(value);
      } else {
        errors.push({ [key]: value });
      }
    });
    return errors;
  }
}
