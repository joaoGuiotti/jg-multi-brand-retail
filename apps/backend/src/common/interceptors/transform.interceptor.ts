import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map((data) => this.transformDecimals(data)));
    }

    private transformDecimals(data: any): any {
        if (data === null || data === undefined) {
            return data;
        }

        if (data instanceof Decimal) {
            return data.toNumber();
        }

        if (Array.isArray(data)) {
            return data.map((item) => this.transformDecimals(item));
        }

        if (typeof data === 'object') {
            const transformed: any = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    transformed[key] = this.transformDecimals(data[key]);
                }
            }
            return transformed;
        }

        return data;
    }
}
