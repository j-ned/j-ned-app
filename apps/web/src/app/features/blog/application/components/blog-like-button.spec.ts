import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlogLikeButton } from './blog-like-button';
import { BlogGateway } from '../../domain/gateways/blog.gateway';

describe('BlogLikeButton', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => TestBed.resetTestingModule());

  it("envoie le like au premier clic et affiche l'état liké", async () => {
    const likePost = vi.fn().mockReturnValue(of({ likesCount: 6 }));
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(likePost).toHaveBeenCalledWith('mon-article');
    expect(fixture.nativeElement.textContent).toContain('6');
  });

  it('ne renvoie pas de requête si déjà liké dans ce navigateur (localStorage)', () => {
    localStorage.setItem('blog-liked-posts', JSON.stringify(['mon-article']));
    const likePost = vi.fn().mockReturnValue(of({ likesCount: 6 }));
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(likePost).not.toHaveBeenCalled();
  });
});
