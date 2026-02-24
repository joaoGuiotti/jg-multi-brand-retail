import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginDto, RefreshTokenDto, RegisterDto } from '@infrastructure/dtos/auth';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthPresenter, UserProfilePresenter } from '../presenters/auth.presenter';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly registerUseCase: RegisterUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly getProfileUseCase: GetProfileUseCase,
    ) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const output = await this.registerUseCase.execute(dto);
        return new AuthPresenter(output);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        const output = await this.loginUseCase.execute(dto);
        return new AuthPresenter(output);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() dto: RefreshTokenDto) {
        return this.refreshTokenUseCase.execute(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@CurrentUser() user: any) {
        const output = await this.getProfileUseCase.execute({ userId: user.sub });
        return new UserProfilePresenter(output);
    }
}
