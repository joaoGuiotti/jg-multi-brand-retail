import { Injectable } from '@nestjs/common';
import { LoyaltyRepository } from '../../../domain/repositories/loyalty/loyalty.repository.interface';
import { LoyaltyProgram } from '../../../domain/entities/loyalty/loyalty-program.entity';
import { ConfigureLoyaltyProgramDto } from '../../../infrastructure/dtos/loyalty/configure-loyalty-program.dto';

export interface LoyaltyProgramOutput {
  id: string;
  tenantId: string;
  name: string;
  pointsPerReal: number;
  redeemRatio: number;
  minRedeemPoints: number;
  maxDiscountPct: number;
  expirationDays: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConfigureLoyaltyProgramUseCase {
  constructor(private readonly loyaltyRepository: LoyaltyRepository) {}

  async execute(
    tenantId: string,
    dto: ConfigureLoyaltyProgramDto,
  ): Promise<LoyaltyProgramOutput> {
    // 1. Busca se já existe um programa para o Tenant ativo
    let program = await this.loyaltyRepository.findProgramByTenantId(tenantId);

    if (program) {
      // 2. Se já existe, atualiza as configurações usando os métodos ricos de domínio
      program.update({
        pointsPerReal: dto.pointsPerReal,
        redeemRatio: dto.redeemRatio,
        minRedeemPoints: dto.minRedeemPoints,
        maxDiscountPct: dto.maxDiscountPct,
        active: dto.active,
      });
    } else {
      // 3. Se não existe, cria um novo rascunho de programa
      program = LoyaltyProgram.create({
        tenantId,
        name: 'Programa de Fidelidade',
        pointsPerReal: dto.pointsPerReal,
        redeemRatio: dto.redeemRatio,
        minRedeemPoints: dto.minRedeemPoints,
        maxDiscountPct: dto.maxDiscountPct,
        active: dto.active,
        expirationDays: null, // Garantido sem expiração por padrão na v1
      });
    }

    // 4. Salva no banco através do repositório
    await this.loyaltyRepository.saveProgram(program);

    // 5. Retorna o mapeamento em formato de output typesafe
    return {
      id: program.id.toString(),
      tenantId: program.tenantId,
      name: program.name,
      pointsPerReal: program.pointsPerReal,
      redeemRatio: program.redeemRatio,
      minRedeemPoints: program.minRedeemPoints,
      maxDiscountPct: program.maxDiscountPct,
      expirationDays: program.expirationDays ?? null,
      active: program.active,
      createdAt: program.createdAt ?? new Date(),
      updatedAt: program.updatedAt ?? new Date(),
    };
  }
}
