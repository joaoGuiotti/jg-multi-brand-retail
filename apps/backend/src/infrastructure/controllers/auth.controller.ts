import { CreateUserUseCase } from '@application/use-cases/auth/create-user.use-case';
import { ForgotPasswordUseCase } from '@application/use-cases/auth/forgot-password.use-case';
import { GetProfileUseCase } from '@application/use-cases/auth/get-profile.use-case';
import { ListUsersUseCase } from '@application/use-cases/auth/list-users.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '@application/use-cases/auth/refresh-token.use-case';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { ResetPasswordUseCase } from '@application/use-cases/auth/reset-password.use-case';
import { Roles } from '@infrastructure/decorators/roles.decorator';
import {
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from '@infrastructure/dtos/auth';
import { GetPublicTenantUseCase } from '@application/use-cases/auth/get-public-tenant.use-case';
import { RolesGuard } from '@infrastructure/guards/roles.guard';
import { LogoutUseCase } from '@application/use-cases/auth/logout.use-case';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  AuthPresenter,
  UserProfilePresenter,
} from '../presenters/auth.presenter';
import {
  ForbiddenResponseDto,
  NotFoundResponseDto,
  UnauthorizedResponseDto,
  ValidationErrorResponseDto,
} from '../dtos/common/api-responses.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getPublicTenantUseCase: GetPublicTenantUseCase,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }

  @Get('tenants/by-slug/:slug')
  @ApiOperation({
    summary: 'Buscar tenant público por slug',
    description:
      'Endpoint público (sem autenticação) que retorna as informações básicas de um Tenant a partir do seu slug único. Usado pela tela de login para identificar o contexto da marca.',
    operationId: 'auth_getPublicTenant',
  })
  @ApiParam({
    name: 'slug',
    description: 'Identificador único do Tenant (ex: minha-loja)',
    example: 'minha-loja',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados públicos do Tenant retornados com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Tenant com o slug informado não encontrado',
    type: NotFoundResponseDto,
  })
  async getPublicTenant(@Param('slug') slug: string) {
    return this.getPublicTenantUseCase.execute({ slug });
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registrar novo Tenant e usuário administrador',
    description:
      'Cria um novo Tenant com seu usuário administrador inicial. Este é o ponto de entrada para novos clientes da plataforma.',
    operationId: 'auth_register',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant e usuário criados com sucesso. Retorna tokens JWT.',
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de registro inválidos ou e-mail já em uso',
    type: ValidationErrorResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const output = await this.registerUseCase.execute(dto);
    this.setRefreshTokenCookie(res, output.refreshToken);
    return new AuthPresenter(output);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Autentica o usuário com e-mail e senha no contexto do Tenant. Retorna `accessToken` e envia `refreshToken` em HttpOnly Cookie.',
    operationId: 'auth_login',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticação bem-sucedida. Retorna tokens JWT.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados de login inválidos',
    type: ValidationErrorResponseDto,
  })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const output = await this.loginUseCase.execute({
      ...dto,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    this.setRefreshTokenCookie(res, output.refreshToken);
    return new AuthPresenter(output);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar tokens de acesso',
    description:
      'Gera um novo par de tokens usando o `refreshToken` do HttpOnly Cookie (ou payload de fallback).',
    operationId: 'auth_refreshToken',
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado ou com reuso detectado',
    type: UnauthorizedResponseDto,
  })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ) {
    const token = req.cookies?.refreshToken || dto?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const output = await this.refreshTokenUseCase.execute({
      refreshToken: token,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.setRefreshTokenCookie(res, output.refreshToken);
    return output;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Encerrar sessão (Logout)',
    description:
      'Invalida a família de refresh tokens no banco e remove o cookie HttpOnly.',
    operationId: 'auth_logout',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessão encerrada com sucesso',
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto?: RefreshTokenDto,
  ) {
    const token = req.cookies?.refreshToken || dto?.refreshToken;
    if (token) {
      await this.logoutUseCase.execute({ refreshToken: token });
    }
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description:
      'Retorna os dados do usuário atualmente autenticado, incluindo perfil, tenant e permissões.',
    operationId: 'auth_getProfile',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  async getProfile(@CurrentUser() user: any) {
    const output = await this.getProfileUseCase.execute({
      userId: user.id,
      tenantId: user.tenantId,
    });
    return new UserProfilePresenter(output);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Criar usuário no Tenant',
    description:
      'Cria um novo usuário vinculado ao Tenant do administrador autenticado. Apenas perfil ADMIN pode executar esta ação.',
    operationId: 'auth_createUser',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas perfil ADMIN pode criar usuários',
    type: ForbiddenResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos ou e-mail já em uso',
    type: ValidationErrorResponseDto,
  })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.createUserUseCase.execute({
      ...dto,
      tenantId: user.tenantId,
    });
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Listar usuários do Tenant',
    description:
      'Retorna todos os usuários vinculados ao Tenant do usuário autenticado. Acessível por ADMIN e SUPER_ADMIN.',
    operationId: 'auth_listUsers',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente ou inválido',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Perfil sem permissão para listar usuários',
    type: ForbiddenResponseDto,
  })
  async listUsers(@CurrentUser() user: any) {
    return this.listUsersUseCase.execute({
      tenantId: user.tenantId,
    });
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar redefinição de senha',
    description:
      'Envia um e-mail com link/token para redefinição de senha. Por segurança, sempre retorna 200 independente de o e-mail existir ou não.',
    operationId: 'auth_forgotPassword',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitação processada (e-mail enviado se o usuário existir)',
  })
  @ApiResponse({
    status: 422,
    description: 'Formato de e-mail inválido',
    type: ValidationErrorResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir senha com token',
    description:
      'Redefine a senha do usuário usando o token recebido por e-mail no fluxo de recuperação.',
    operationId: 'auth_resetPassword',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de redefinição inválido ou expirado',
    type: UnauthorizedResponseDto,
  })
  @ApiResponse({
    status: 422,
    description: 'Dados inválidos (senha muito curta, tokens não conferem)',
    type: ValidationErrorResponseDto,
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }
}
