import type { S3Client } from '@aws-sdk/client-s3';
import { AnalyticsAggregatorService } from './analytics/analytics-aggregator.service';
import { AnalyticsStatsService } from './analytics/analytics-stats.service';
import { AnalyticsTrackerService } from './analytics/analytics-tracker.service';
import { AuthService } from './auth/auth.service';
import { JwtService } from './auth/jwt.service';
import { LoginJournalService } from './auth/login-journal.service';
import { PasswordService } from './auth/password.service';
import { TwoFactorService } from './auth/two-factor.service';
import { BlogContentImagesService } from './blog/blog-content-images.service';
import { BlogService } from './blog/blog.service';
import { BlogCommentsService } from './blog-comments/blog-comments.service';
import { DrizzleCommentStore } from './blog-comments/drizzle-comment-store';
import { senderHasher } from './common/sender-hash';
import type { AppConfigService } from './config/app-config.service';
import { ContactService } from './contact/contact.service';
import { CvService } from './cv/cv.service';
import type { Database } from './database/drizzle.types';
import { createMailer } from './mailer/mail-transport';
import { ProfilePortraitService } from './profile/profile-portrait.service';
import { ProfileService } from './profile/profile.service';
import { ProjectImagesService } from './projects/project-images.service';
import { ProjectsService } from './projects/projects.service';
import { ImageOptimizer } from './storage/image-optimizer.service';
import { ResizedImageService } from './storage/resized-image.service';
import { ShareCardService } from './storage/share-card.service';
import { StorageService } from './storage/storage.service';
import { UsersService } from './users/users.service';

export type ServiceDeps = {
  readonly config: AppConfigService;
  readonly db: Database;
  // `null` : stockage de fichiers désactivé (503), hors production seulement.
  readonly s3: S3Client | null;
};

// Chaque service reçoit ses dépendances explicitement, en une seule instance.
export function createServices({ config, db, s3 }: ServiceDeps) {
  const storage = new StorageService(s3);
  const images = new ImageOptimizer();
  const users = new UsersService(db);
  const jwt = new JwtService(config.jwtSecret, config.jwtExpiresIn);
  const loginJournal = new LoginJournalService(db);
  const projectImages = new ProjectImagesService(db, storage, images);
  const blogContentImages = new BlogContentImagesService(db, storage, images);
  const mailer = createMailer(config.mailTransport);

  return {
    storage,
    images,
    shareCards: new ShareCardService(storage, images),
    resizedImages: new ResizedImageService(storage, images),
    users,
    jwt,
    auth: new AuthService(
      users,
      new PasswordService(),
      new TwoFactorService(config),
      jwt,
      loginJournal,
    ),
    loginJournal,
    contact: new ContactService(db, mailer, config),
    projects: new ProjectsService(db, storage, images, projectImages),
    projectImages,
    blog: new BlogService(db, storage, images, blogContentImages),
    blogContentImages,
    blogComments: new BlogCommentsService(
      new DrizzleCommentStore(db),
      mailer,
      senderHasher(config.jwtSecret, 'comments'),
    ),
    profile: new ProfileService(db, storage),
    profilePortrait: new ProfilePortraitService(db, storage, images),
    cv: new CvService(db, storage),
    analyticsTracker: new AnalyticsTrackerService(db, config),
    analyticsStats: new AnalyticsStatsService(db),
    analyticsAggregator: new AnalyticsAggregatorService(db),
  };
}

export type Services = ReturnType<typeof createServices>;
