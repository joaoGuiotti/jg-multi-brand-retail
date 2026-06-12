import { Component, inject, OnInit, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  UiButtonComponent, 
  UiCardComponent 
} from '@shared/ui';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [
    RouterModule,
    UiButtonComponent,
    UiCardComponent
],
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.scss'
})
export class AccessDeniedComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);

  title = signal('Acesso Negado');
  message = signal('Ops! Parece que você não tem as permissões necessárias para acessar esta página. Se você acredita que isso é um erro, entre em contato com o administrador do sistema.');

  ngOnInit(): void {
    const titleParam = this.route.snapshot.queryParamMap.get('title');
    const messageParam = this.route.snapshot.queryParamMap.get('message');

    if (titleParam) this.title.set(titleParam);
    if (messageParam) this.message.set(messageParam);
  }

  goBack(): void {
    this.location.back();
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
