import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './transform.interceptor';

export const provideTransformInterceptor = () => {
  return {
    provide: APP_INTERCEPTOR,
    useClass: TransformInterceptor,
  };
};
