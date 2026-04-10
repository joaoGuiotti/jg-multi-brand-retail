import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IResponse } from '../../../core/models/response-base';

export interface Notification {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  readAt?: string;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationPreference {
  id: string;
  type: string;
  enabled: boolean;
  sound: boolean;
}

export interface UpdatePreferenceDto {
  type: string;
  enabled: boolean;
  sound: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/v1/notifications`;

  getNotifications(page: number = 1, limit: number = 20): Observable<IResponse<PaginatedNotifications>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<IResponse<PaginatedNotifications>>(this.apiUrl, { params });
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ count: number }> {
    return this.http.patch<{ count: number }>(`${this.apiUrl}/read-all`, {});
  }

  getPreferences(): Observable<NotificationPreference[]> {
    return this.http.get<NotificationPreference[]>(`${this.apiUrl}/preferences`);
  }

  updatePreference(dto: UpdatePreferenceDto): Observable<NotificationPreference> {
    return this.http.patch<NotificationPreference>(`${this.apiUrl}/preferences`, dto);
  }
}
