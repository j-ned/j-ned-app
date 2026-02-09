import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { ContactGateway } from '../../domain';
import type {
  ContactInfo,
  SocialLinks,
  ContactFormData,
  ContactFormSubmission,
  ContactMessage,
} from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseContactGateway implements ContactGateway {
  private readonly supabase = inject(SupabaseClientService);

  getContactInfo(): ResourceRef<ContactInfo> {
    return resource({
      loader: async () => {
        const { data, error } = await this.supabase.client
          .from('contact_info')
          .select('*')
          .limit(1)
          .single();
        if (error) throw error;
        return toCamelCase<ContactInfo>(data);
      },
    }) as ResourceRef<ContactInfo>;
  }

  getSocialLinks(): Observable<SocialLinks> {
    return from(this.supabase.client.from('social_links').select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data['data'] ?? {}) as SocialLinks;
      }),
      catchError(() => of({} as SocialLinks)),
    );
  }

  submitContactForm(formData: ContactFormData): Observable<ContactFormSubmission> {
    return from(
      this.supabase.client.from('contact_messages').insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      }),
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;
        return from(
          this.supabase.client.functions.invoke('resend-email', {
            body: {
              name: formData.name,
              email: formData.email,
              subject: formData.subject,
              message: formData.message,
            },
          }),
        ).pipe(
          map(() => ({
            success: true as const,
            message: 'Votre message a été envoyé avec succès !',
          })),
          catchError(() =>
            of({
              success: true as const,
              message: 'Votre message a été envoyé avec succès !',
            }),
          ),
        );
      }),
      catchError(() =>
        of({
          success: false,
          message: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
        }),
      ),
    );
  }

  getAllMessages(): Observable<readonly ContactMessage[]> {
    return from(
      this.supabase.client
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<ContactMessage>(row));
      }),
      catchError(() => of([])),
    );
  }

  markMessageAsRead(id: number): Observable<ContactMessage> {
    return from(
      this.supabase.client
        .from('contact_messages')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Message not found'));
        return of(toCamelCase<ContactMessage>(data));
      }),
    );
  }

  deleteMessage(id: number): Observable<void> {
    return from(this.supabase.client.from('contact_messages').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getUnreadCount(): Observable<number> {
    return from(
      this.supabase.client
        .from('contact_messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false),
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
      catchError(() => of(0)),
    );
  }
}
