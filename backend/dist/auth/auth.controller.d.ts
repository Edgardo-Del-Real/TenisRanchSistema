import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenBlacklistService } from './token-blacklist.service';
export declare class AuthController {
    private readonly authService;
    private readonly tokenBlacklistService;
    constructor(authService: AuthService, tokenBlacklistService: TokenBlacklistService);
    register(dto: RegisterDto): Promise<Omit<import("../entities").Usuario, "password_hash">>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
    getProfile(req: any): Promise<any>;
    logout(req: any): Promise<{
        message: string;
    }>;
}
