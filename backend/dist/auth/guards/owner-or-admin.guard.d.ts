import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class OwnerOrAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
