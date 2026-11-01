import './instrument';
import 'reflect-metadata';
import { bootstrap } from './bootstrap';

// Point d'entrée de la fonction Vercel (service `api`) : l'application Hono, sans serveur ni tâche
// planifiée (le rollup quotidien passe par Vercel Cron). Les connexions sont ouvertes au chargement du
// module et réutilisées d'une requête à l'autre par l'instance.
export default bootstrap().app;
