import { Hono } from 'hono';
import auth from './auth.js';
import projects from './projects.js';
import bookings from './bookings.js';
import contact from './contact.js';
import cv from './cv.js';
import analytics from './analytics.js';
import profile, { biographyRoutes } from './profile.js';
import socialLinks from './social-links.js';
import diplomas from './diplomas.js';
import technologies from './technologies.js';
import highlights from './highlights.js';
import expertises from './expertises.js';
import aspirationRoutes from './aspiration.js';
import { heroRoutes, servicePricingRoutes, homeHighlightRoutes } from './home.js';
import homeBundle from './home-bundle.js';
import images from './images.js';

export function registerRoutes(app: Hono) {
  app.route('/auth', auth);
  app.route('/projects', projects);
  app.route('/bookings', bookings);
  app.route('/contact', contact);
  app.route('/cv', cv);
  app.route('/analytics', analytics);
  app.route('/profile', profile);
  app.route('/biography', biographyRoutes);
  app.route('/social-links', socialLinks);
  app.route('/diplomas', diplomas);
  app.route('/technologies', technologies);
  app.route('/highlights', highlights);
  app.route('/expertises', expertises);
  app.route('/aspiration', aspirationRoutes);
  app.route('/hero', heroRoutes);
  app.route('/service-pricing', servicePricingRoutes);
  app.route('/home-highlights', homeHighlightRoutes);
  app.route('/home-bundle', homeBundle);
  app.route('/images', images);
}
