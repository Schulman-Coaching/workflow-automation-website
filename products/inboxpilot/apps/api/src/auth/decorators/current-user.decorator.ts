import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    planId: string | null;
  };
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (data) {
      return user[data];
    }

    return user;
  },
);
