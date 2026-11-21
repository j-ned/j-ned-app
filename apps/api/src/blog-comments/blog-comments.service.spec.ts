import { ConflictException, NotFoundException } from '../common/http-errors';
import { memoryHarness } from '../testing/comment-harness';
import { MemoryCommentStore } from '../testing/memory-comment-store';
import { BlogCommentsService } from './blog-comments.service';

const NOW = new Date('2026-11-21T12:00:00.000Z');

// Stockage où une autre requête agit entre la lecture du commentaire et son écriture.
class RacingStore extends MemoryCommentStore {
  beforeWrite: () => void = () => {};

  override insertOwnerReply(
    ...args: Parameters<MemoryCommentStore['insertOwnerReply']>
  ) {
    this.beforeWrite();
    return super.insertOwnerReply(...args);
  }

  override moderate(
    ...args: Parameters<MemoryCommentStore['moderate']>
  ): Promise<boolean> {
    this.beforeWrite();
    return super.moderate(...args);
  }
}

describe('BlogCommentsService under concurrent moderation', () => {
  const setup = async (status: 'pending' | 'published' = 'pending') => {
    const store = new RacingStore();
    const harness = memoryHarness(store);
    const service = new BlogCommentsService(
      store,
      { sendMail: () => Promise.resolve() },
      () => 'sender',
      () => NOW,
    );
    const post = await harness.seedPost({ slug: 'usinage' });
    const comment = await harness.seedComment({
      postId: post.id,
      status,
    });
    return { store, service, comment };
  };

  it('Given a comment deleted between its reading and its update, When the owner publishes it, Then 404 and not a server error', async () => {
    const { store, service, comment } = await setup();
    store.beforeWrite = () => {
      store.comments = [];
    };

    await expect(service.moderate(comment.id, 'published')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('Given a comment refused by another request between its reading and its update, When the owner publishes it, Then 409 and the refusal stands', async () => {
    const { store, service, comment } = await setup();
    const refusedAt = new Date('2026-11-21T11:59:59.000Z');
    store.beforeWrite = () => {
      store.comments = store.comments.map((c) => ({
        ...c,
        status: 'refused',
        moderatedAt: refusedAt,
      }));
    };

    await expect(service.moderate(comment.id, 'published')).rejects.toThrow(
      ConflictException,
    );
    expect(store.comments).toEqual([
      { ...comment, status: 'refused', moderatedAt: refusedAt },
    ]);
  });

  it('Given a comment deleted between its reading and the reply, When the owner answers it, Then 404 and nothing is stored', async () => {
    const { store, service, comment } = await setup('published');
    store.beforeWrite = () => {
      store.comments = [];
    };

    await expect(service.reply(comment.id, 'Merci')).rejects.toThrow(
      NotFoundException,
    );
    expect(store.comments).toEqual([]);
  });
});
