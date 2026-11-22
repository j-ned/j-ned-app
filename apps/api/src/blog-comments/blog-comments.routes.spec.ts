import { memoryHarness } from '../testing/comment-harness';
import { describeCommentRoutes } from '../testing/comment-route-scenarios';

describeCommentRoutes('in memory', () => Promise.resolve(memoryHarness()));
