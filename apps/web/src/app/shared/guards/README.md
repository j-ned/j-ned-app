# SEO Guard - Gestion centralisée du SEO

## 📋 Vue d'ensemble

Le `seoGuard` est un **functional guard** Angular qui centralise la gestion du SEO pour toute l'application. Il élimine la duplication de code dans les composants et applique automatiquement les meta tags lors de la navigation.

## 🎯 Avantages

### ✅ **Avant** (Code dupliqué)

```typescript
export class Home implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: '...',
      description: '...',
      // ... répété dans chaque composant
    });
  }
}
```

### ✅ **Après** (Configuration centralisée)

```typescript
// app.routes.ts
{
  path: '',
  loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  canActivate: [seoGuard],
  data: {
    seo: {
      title: '...',
      description: '...',
    }
  }
}

// home.ts - Plus besoin de ngOnInit !
export class Home {
  // Composant ultra simple
}
```

## 🚀 Utilisation

### 1. Configuration de base dans les routes

```typescript
import { seoGuard } from './shared/guards/seo.guard';

{
  path: 'about',
  loadComponent: () => import('./pages/about/about').then((m) => m.About),
  canActivate: [seoGuard],
  data: {
    seo: {
      title: 'À propos | Mon Site',
      description: 'Découvrez mon parcours',
      keywords: 'mot-clé 1, mot-clé 2',
      url: 'https://monsite.fr/about',
      type: 'profile',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John Doe'
      }
    }
  }
}
```

### 2. Données SEO dynamiques avec Resolver

Pour les pages avec des données dynamiques (ex: liste de projets) :

```typescript
// projects.resolver.ts
export const projectsSeoResolver: ResolveFn<void> = () => {
  const seoService = inject(SeoService);

  seoService.addStructuredData({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    // ... données dynamiques
  });
};

// app.routes.ts
{
  path: 'projects',
  canActivate: [seoGuard],
  resolve: { seoData: projectsSeoResolver },
  data: { seo: { /* ... */ } }
}
```

## 📐 Architecture

```
┌─────────────────┐
│   Navigation    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   seoGuard      │ ← Intercepte la navigation
└────────┬────────┘
         │
         ├─► Lit route.data['seo']
         │
         ├─► Appelle seoService.updateMetaTags()
         │
         └─► Appelle seoService.addStructuredData()

┌─────────────────┐
│   Component     │ ← Composant ultra simple
└─────────────────┘   (pas de logique SEO)
```

## 🔧 Interface

```typescript
export interface SeoRouteData extends SeoData {
  structuredData?: object; // JSON-LD Schema.org
}

export interface SeoData {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: string;
}
```

## 💡 Best Practices

### ✅ DO

- Configurer le SEO dans les routes
- Utiliser un resolver pour les données dynamiques
- Garder les composants simples sans logique SEO
- Utiliser structured data pour le rich snippets

### ❌ DON'T

- Dupliquer la logique SEO dans chaque composant
- Mettre du SEO dans `ngOnInit`
- Oublier le `canActivate: [seoGuard]`

## 📦 Fichiers créés

```
src/app/shared/guards/
├── seo.guard.ts          # Guard fonctionnel
└── README.md             # Cette documentation

src/app/pages/projects/
└── projects.resolver.ts  # Resolver pour données dynamiques
```

## 🎓 Concepts Angular utilisés

- ✅ **Functional Guard** (moderne, pas de classe)
- ✅ **Route Data** (configuration déclarative)
- ✅ **Resolver** (données dynamiques avant activation)
- ✅ **Dependency Injection** avec `inject()`

---

**Résultat** : Code plus propre, maintenable et respectant le principe DRY (Don't Repeat Yourself) 🚀
