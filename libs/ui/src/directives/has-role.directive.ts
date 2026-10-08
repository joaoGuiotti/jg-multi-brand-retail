import { Directive, ElementRef, Input, Renderer2, effect, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export type HasRoleAction = 'hide' | 'disable';

@Directive({
    selector: '[uiHasRole]',
    standalone: true
})
export class UiHasRoleDirective {
    @Input('uiHasRole') roles: string[] | string = [];
    @Input() uiHasRoleAction: HasRoleAction = 'hide';

    private authService = inject(AuthService);
    private renderer = inject(Renderer2);
    private el = inject(ElementRef);

    private originalDisplay = '';
    private hasInitialized = false;

    constructor() {
        effect(() => {
            const user = this.authService.user();
            const userRole = user?.role;

            if (!this.hasInitialized) {
                this.originalDisplay = this.el.nativeElement.style.display || '';
                this.hasInitialized = true;
            }

            let requiredRoles: string[] = [];
            if (typeof this.roles === 'string') {
                requiredRoles = [this.roles];
            } else if (Array.isArray(this.roles)) {
                requiredRoles = this.roles;
            }

            // Consider SUPER_ADMIN as having all permissions structurally for UI as well
            const hasPermission = userRole && (requiredRoles.includes(userRole) || userRole === 'SUPER_ADMIN');

            if (!hasPermission) {
                if (this.uiHasRoleAction === 'hide') {
                    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
                } else if (this.uiHasRoleAction === 'disable') {
                    this.renderer.setAttribute(this.el.nativeElement, 'disabled', 'true');
                    this.renderer.addClass(this.el.nativeElement, 'opacity-50');
                    this.renderer.addClass(this.el.nativeElement, 'pointer-events-none');
                    this.renderer.addClass(this.el.nativeElement, 'cursor-not-allowed');
                }
            } else {
                if (this.uiHasRoleAction === 'hide') {
                    this.renderer.setStyle(this.el.nativeElement, 'display', this.originalDisplay);
                } else if (this.uiHasRoleAction === 'disable') {
                    this.renderer.removeAttribute(this.el.nativeElement, 'disabled');
                    this.renderer.removeClass(this.el.nativeElement, 'opacity-50');
                    this.renderer.removeClass(this.el.nativeElement, 'pointer-events-none');
                    this.renderer.removeClass(this.el.nativeElement, 'cursor-not-allowed');
                }
            }
        });
    }
}
