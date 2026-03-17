import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { EUserRole } from "@core/models/auth.model";
import { AuthService } from "../services/auth.service";


export const adminGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const enabledRoles = [EUserRole.ADMIN, EUserRole.SUPER_ADMIN];

    if (authService.user() && enabledRoles.includes(authService.user()!.role)) {
        return true;
    }

    router.navigate(['/access-denied'], { 
        queryParams: { 
            title: 'Área Restrita', 
            message: 'Apenas administradores podem acessar esta funcionalidade. Por favor, solicite privilégios ao administrador se necessário.' 
        } 
    });
    return false;
};
