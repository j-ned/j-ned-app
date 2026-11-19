# Signal Forms Angular (stable en v22) — Reference

> API de `@angular/forms/signals`, verifiee sur `@angular/forms` 22.2.2. Doctrine du depot : section
> « Formulaires » de `.claude/CLAUDE.md`. Footguns detailles : skill AAK `angular-signal-forms`.
> Il n'existe ni classe `SignalForm`, ni fonction `formField()`, ni `champ.state()` : un formulaire se
> cree avec `form()`, et l'etat d'un champ se lit en **appelant** le champ.

## Imports

```typescript
import {
  FormField, // directive [formField]
  FormRoot, // directive [formRoot] sur <form>
  form,
  submit,
  required,
  minLength,
  maxLength,
  pattern,
  validate,
  applyEach,
  type FieldTree,
} from '@angular/forms/signals';
```

Aussi exportes : `email`, `min`, `max`, `disabled`, `hidden`, `readonly`, `debounce`, `validateAsync`,
`validateHttp`, `validateTree`, `validateStandardSchema`, `schema`, `apply`, `applyWhen`.

## Modele, schema, soumission

```typescript
const EMPTY_CONTACT: ContactFormData = { name: '', email: '', message: '' };

@Component({
  selector: 'app-contact-form',
  imports: [FormRoot, FormField],
  template: `
    <form [formRoot]="contactForm">
      @let nameInError = contactForm.name().touched() && contactForm.name().invalid();
      <label for="name">Ton nom</label>
      <input
        id="name"
        type="text"
        [formField]="contactForm.name"
        aria-required="true"
        [attr.aria-invalid]="nameInError"
      />
      <button type="submit" [disabled]="contactForm().submitting()">Envoyer</button>
    </form>
  `,
})
export class ContactForm {
  private readonly _model = signal<ContactFormData>(EMPTY_CONTACT);

  readonly contactForm = form(
    this._model,
    (path) => {
      required(path.name, { message: 'Le nom est obligatoire' });
      minLength(path.name, 2, { message: 'Le nom doit contenir au moins 2 caracteres' });
      required(path.email, { message: "L'email est obligatoire" });
      pattern(path.email, EMAIL_PATTERN, { message: "Format d'email invalide" });
    },
    {
      submission: {
        action: (field) => this.send(field),
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  async submitContact(): Promise<void> {
    await submit(this.contactForm);
  }

  private async send(field: FieldTree<ContactFormData>): Promise<void> {
    const { name, email, message } = field().value();
    // appel du gateway, puis :
    field().reset(EMPTY_CONTACT);
  }
}
```

- Le modele est un `signal()` (ou un `linkedSignal()` sur l'`input()` a editer) a defauts **non `null`** :
  `''`, `0`, `[]`, `false`.
- `contactForm.name` est le champ (a passer a `[formField]`) ; `contactForm.name()` rend son etat :
  `.value()`, `.touched()`, `.invalid()`, `.reset(valeur)`.
- `[formRoot]` branche l'evenement submit sur `submission.action` ; `submit(form)` fait la meme chose
  depuis le code et les tests. L'action ne part que si le formulaire est valide.
- L'action de soumission est `async`.

## Regles du depot

- `[formField]` possede l'element : pas de `required`, `disabled`, `[value]`, `maxlength` ni `pattern`
  poses a cote sur le meme element.
- Bouton d'envoi desactive **uniquement** pendant `form().submitting()`, jamais sur `invalid()`.
- Messages d'erreur dans le schema ; le template affiche la premiere erreur du champ touche.
- Validation croisee : `validate(path.confirm, ({ value, valueOf }) => …)` sur le champ que
  l'utilisateur corrige.
- Tableaux : `applyEach(path.items, (item) => …)` ; ajout et retrait par `model.update()`.
- Pas de `ReactiveFormsModule`, `FormsModule` ni `ngModel` dans le depot.

## Exemples reels dans le depot

- `src/app/features/contact/application/contact-form.ts` : formulaire de page.
- `src/app/features/auth/application/password-change-form.ts` : validation croisee.
- `src/app/features/admin/application/components/admin-project-form.ts` : tableaux `applyEach`.
- `src/app/features/admin/application/components/admin-pair-rows.ts` : ajout et retrait de lignes.
- `src/app/features/admin/application/editor-draft.ts` : `linkedSignal` sur l'entite editee.
