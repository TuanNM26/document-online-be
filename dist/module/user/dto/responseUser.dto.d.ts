declare class RoleDto {
    id: string;
    roleName: string;
}
export declare class UserResponseDto {
    id: string;
    username: string;
    email: string;
    role?: RoleDto;
}
export {};
