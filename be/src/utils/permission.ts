import {Permission} from "./enum";

export class PermissionUtils {
    static hasPermission(user_permissions: number, permission: Permission): boolean {
        return (user_permissions & permission) !== 0;
    }

    static addPermission(user_permissions: number, permission: Permission): number {
        return user_permissions | permission;
    }

    static removePermission(user_permissions: number, permission: Permission): number {
        return user_permissions & ~permission;
    }

    static listPermissions(user_permissions: number): string[] {
        return Object.keys(Permission)
            .filter(key => !isNaN(Number(Permission[key as keyof typeof Permission]))) // Filter numeric keys
            .filter(key => (user_permissions & Permission[key as keyof typeof Permission]) !== 0);
    }
}