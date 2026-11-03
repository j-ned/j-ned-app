import {
  OUTBOUND_CHANNELS,
  RETIRED_OUTBOUND_CHANNELS,
} from './dto/track-event.dto';
import { ENGAGEMENT_EVENT_TYPES, OUTBOUND_GROUPS } from './engagement';

/** Définitions figées sur l'ADR-0022 (front, `docs/adr/0022-engagement-et-rebond-reel.md`). */
describe('engagement (ADR-0022)', () => {
  it('Given automatic events, Then they never make a visit engaged', () => {
    expect(ENGAGEMENT_EVENT_TYPES).not.toContain('article_view');
    expect(ENGAGEMENT_EVENT_TYPES).not.toContain('page_view');
    expect(ENGAGEMENT_EVENT_TYPES).not.toContain('page_duration');
  });

  it('Given the outbound channels, Then contact, profile and demo groups match the ADR and cover every channel once', () => {
    expect(OUTBOUND_GROUPS).toEqual({
      contact: ['email', 'discord', 'phone', 'malt'],
      profile: ['linkedin', 'github'],
      demo: ['demo'],
    });
    expect(Object.values(OUTBOUND_GROUPS).flat().sort()).toEqual(
      [...OUTBOUND_CHANNELS, ...RETIRED_OUTBOUND_CHANNELS].sort(),
    );
  });
});
