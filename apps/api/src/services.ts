import type { S3Client } from '@aws-sdk/client-s3';
import type { Transporter } from 'nodemailer';
import { AnalyticsAggregatorService } from './analytics/analytics-aggregator.service';
import { AnalyticsStatsService } from './analytics/analytics-stats.service';
import { AnalyticsTrackerService } from './analytics/analytics-tracker.service';
import { AuthService } from './auth/auth.service';
import { JwtService } from './auth/jwt.service';
import { PasswordService } from './auth/password.service';
import { TwoFactorService } from './auth/two-factor.service';
import { BlogContentImagesService } from './blog/blog-content-images.service';
import { BlogService } from './blog/blog.service';
import type { AppConfigService } from './config/app-config.service';
import { ContactService } from './contact/contact.service';
import { CvService } from './cv/cv.service';
import type { Database } from './database/drizzle.types';
import { MailerService } from './mailer/mailer.service';
import { ProfilePortraitService } from './profile/profile-portrait.service';
import { ProfileService } from './profile/profile.service';
import { ProjectImagesService } from './projects/project-images.service';
import { ProjectsService } from './projects/projects.service';
import { ImageOptimizer } from './storage/image-optimizer.service';
import { ShareCardService } from './storage/share-card.service';
import { StorageService } from './storage/storage.service';
import { UsersService } from './users/users.service';
import { WorkshopGuideService } from './workshop-guide/workshop-guide.service';

export type ServiceDeps = {
  readonly config: AppConfigService;
  readonly db: Database;
  readonly s3: S3Client;
  readonly transporter: Transporter;
};

/** Racine de composition : chaque service reçoit ses dépendances explicitement, une seule instance. */
export function createServices({ config, db, s3, transporter }: ServiceDeps) {
  const storage = new StorageService(s3);
  const images = new ImageOptimizer();
  const users = new UsersService(db);
  const jwt = new JwtService(config.jwtSecret, config.jwtExpiresIn);
  const projectImages = new ProjectImagesService(db, storage, images);
  const blogContentImages = new BlogContentImagesService(db, storage, images);

  return {
    storage,
    images,
    shareCards: new ShareCardService(storage, images),
    users,
    jwt,
    auth: new AuthService(
      users,
      new PasswordService(),
      new TwoFactorService(config),
      jwt,
    ),
    contact: new ContactService(
      db,
      new MailerService(transporter, config),
      config,
    ),
    projects: new ProjectsService(db, storage, images, projectImages),
    projectImages,
    blog: new BlogService(db, storage, images, blogContentImages),
    blogContentImages,
    profile: new ProfileService(db, storage),
    profilePortrait: new ProfilePortraitService(db, storage, images),
    workshopGuide: new WorkshopGuideService(db),
    cv: new CvService(db, storage),
    analyticsTracker: new AnalyticsTrackerService(db, config),
    analyticsStats: new AnalyticsStatsService(db),
    analyticsAggregator: new AnalyticsAggregatorService(db),
  };
}

export type Services = ReturnType<typeof createServices>;
