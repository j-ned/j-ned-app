import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
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

  it("réinitialise l'état liké quand le slug change (instance de composant réutilisée par le router)", () => {
    const likePost = vi.fn().mockReturnValue(of({ likesCount: 6 }));
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'post-a');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();

    let button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);

    fixture.componentRef.setInput('slug', 'post-b');
    fixture.componentRef.setInput('likesCount', 12);
    fixture.detectChanges();

    button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('12');
  });

  it('Given a like in flight When the button is pressed again before the answer Then a single like is sent', () => {
    const answer = new Subject<{ likesCount: number }>();
    const likePost = vi.fn().mockReturnValue(answer);
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    button.click();

    expect(likePost).toHaveBeenCalledOnce();
  });

  it('Given a like that failed When the button is pressed again Then the like is sent again', () => {
    const likePost = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('network down')))
      .mockReturnValue(of({ likesCount: 6 }));
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    button.click();
    button.click();
    fixture.detectChanges();

    expect({ calls: likePost.mock.calls.length, text: button.textContent }).toEqual({
      calls: 2,
      text: expect.stringContaining('6'),
    });
  });

  it.each([
    { stored: '{}', shape: 'an object' },
    { stored: '"mon-article"', shape: 'a bare string' },
    { stored: '["autre", 42]', shape: 'a list holding a non-string' },
  ])(
    'Given $shape stored instead of the liked list When the post is liked Then the like is sent and the list is rewritten',
    ({ stored }) => {
      localStorage.setItem('blog-liked-posts', stored);
      const likePost = vi.fn().mockReturnValue(of({ likesCount: 6 }));
      TestBed.configureTestingModule({
        providers: [{ provide: BlogGateway, useValue: { likePost } }],
      });
      const fixture = TestBed.createComponent(BlogLikeButton);
      fixture.componentRef.setInput('slug', 'mon-article');
      fixture.componentRef.setInput('likesCount', 5);
      fixture.detectChanges();

      (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

      expect({
        calls: likePost.mock.calls.length,
        stored: localStorage.getItem('blog-liked-posts'),
      }).toEqual({ calls: 1, stored: '["mon-article"]' });
    },
  );

  it("ne plante pas et laisse le bouton cliquable si l'appel réseau échoue", () => {
    const likePost = vi.fn().mockReturnValue(throwError(() => new Error('network down')));
    TestBed.configureTestingModule({
      providers: [{ provide: BlogGateway, useValue: { likePost } }],
    });
    const fixture = TestBed.createComponent(BlogLikeButton);
    fixture.componentRef.setInput('slug', 'mon-article');
    fixture.componentRef.setInput('likesCount', 5);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(() => {
      button.click();
      fixture.detectChanges();
    }).not.toThrow();

    expect(button.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('5');
  });
});
