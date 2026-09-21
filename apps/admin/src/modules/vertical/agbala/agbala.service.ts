import { Injectable, Logger } from '@nestjs/common';
import { mapAndThrow } from '@azeebo/security';
import { upstreamAuthContext } from '../../../common/upstream-auth.middleware';
import { CreateStoryworldDto } from './dto/create-storyworld.dto';
import { UpdateStoryworldDto } from './dto/update-storyworld.dto';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreatePathDto } from './dto/create-path.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class AgbalaService {
  private readonly logger = new Logger(AgbalaService.name);

  private get baseUrl(): string {
    // Agbala storyworlds live on the vertical-service (not content-service);
    // it serves versioned routes (/v1/...).
    return `${process.env.VERTICAL_SERVICE_URL || 'http://localhost:3017'}/v1`;
  }

  private get headers(): Record<string, string> {
    // Identity forwarding, request-scoped: the caller's Bearer header (direct
    // callers) or one minted from their verified access_token cookie (SPA
    // flows), captured by UpstreamAuthMiddleware. Falls back to forwarding the
    // gateway-identity stamp (x-user-* + the gateway's secret) verbatim.
    // Previously this forwarded a class-static authHeader — cookie-only SPA
    // requests sent none (→ 502 via upstream 401), and concurrent requests
    // could cross-contaminate identities.
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.INTERNAL_API_KEY || '',
    };

    const auth = upstreamAuthContext.getStore();
    if (auth?.authorization) {
      // The Bearer token is itself the verified identity. Do NOT also forward
      // x-user-* here: ServiceAuthGuard rejects stamp headers that arrive
      // without a valid x-gateway-secret, and the Bearer needs no stamp.
      headers['authorization'] = auth.authorization;
      return headers;
    }

    if (auth?.userId) {
      // Gateway-stamped identity without a raw JWT (service-token flows):
      // forward the stamp and the gateway's own secret verbatim — re-deriving
      // the secret from env is unreliable (per-service env drift).
      headers['x-user-id'] = auth.userId;
      if (auth.email) headers['x-user-email'] = auth.email;
      if (auth.role) headers['x-user-role'] = auth.role;
      if (auth.gatewaySecret) {
        headers['x-gateway-secret'] = auth.gatewaySecret;
      } else {
        const secret = process.env.GATEWAY_SECRET || process.env.INTERNAL_API_KEY;
        if (secret) headers['x-gateway-secret'] = secret;
      }
    }
    return headers;
  }

  private async fetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: {
        ...this.headers,
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => 'Request failed');
      // Carry the upstream status on the thrown error so mapAndThrow can map
      // it truthfully (404 → NotFound, 4xx passthrough, 5xx → Bad Gateway)
      // instead of every failure collapsing into one hardcoded status.
      throw Object.assign(new Error(`HTTP ${res.status}: ${msg}`), {
        response: { status: res.status, data: { message: msg } },
      });
    }
    return res.json();
  }

  async getStoryworlds(query: { page?: number; limit?: number; search?: string }) {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', query.page.toString());
      if (query.limit) params.set('limit', query.limit.toString());
      if (query.search) params.set('search', query.search);
      // vertical-service's real route (no /agbala segment)
      return this.fetch(`/vertical/storyworlds?${params.toString()}`);
    } catch (error) {
      this.logger.error('Failed to fetch storyworlds', error);
      throw error;
    }
  }

  async getStoryworld(id: string) {
    try {
      return this.fetch(`/vertical/storyworlds/${id}`);
    } catch (error) {
      this.logger.error(`Failed to fetch storyworld ${id}`, error);
      mapAndThrow(error, `fetching storyworld ${id} from content-service`);
    }
  }

  async createStoryworld(dto: CreateStoryworldDto) {
    try {
      return this.fetch('/vertical/agbala/storyworlds', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error('Failed to create storyworld', error);
      throw error;
    }
  }

  async updateStoryworld(id: string, dto: UpdateStoryworldDto) {
    try {
      return this.fetch(`/vertical/agbala/storyworlds/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error(`Failed to update storyworld ${id}`, error);
      throw error;
    }
  }

  async deleteStoryworld(id: string) {
    try {
      return this.fetch(`/vertical/agbala/storyworlds/${id}`, { method: 'DELETE' });
    } catch (error) {
      this.logger.error(`Failed to delete storyworld ${id}`, error);
      throw error;
    }
  }

  async createCharacter(storyworldId: string, dto: CreateCharacterDto) {
    try {
      return this.fetch('/vertical/characters', {
        method: 'POST',
        body: JSON.stringify({ ...dto, universe: storyworldId }),
      });
    } catch (error) {
      this.logger.error('Failed to create character', error);
      throw error;
    }
  }

  async updateCharacter(characterId: string, dto: UpdateCharacterDto) {
    try {
      return this.fetch(`/vertical/characters/${characterId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error(`Failed to update character ${characterId}`, error);
      throw error;
    }
  }

  async deleteCharacter(characterId: string) {
    try {
      return this.fetch(`/vertical/agbala/characters/${characterId}`, { method: 'DELETE' });
    } catch (error) {
      this.logger.error(`Failed to delete character ${characterId}`, error);
      throw error;
    }
  }

  async getCharacters(storyworldId: string) {
    try {
      // characters live at /vertical/characters, filterable by universe slug
      return this.fetch(`/vertical/characters?universe=${encodeURIComponent(storyworldId)}`);
    } catch (error) {
      this.logger.error(`Failed to fetch characters for storyworld ${storyworldId}`, error);
      throw error;
    }
  }

  async getPaths(storyworldId: string) {
    try {
      return this.fetch(`/vertical/agbala/storyworlds/${storyworldId}/paths`);
    } catch (error) {
      this.logger.error(`Failed to list paths for storyworld ${storyworldId}`, error);
      throw error;
    }
  }

  async createPath(storyworldId: string, dto: CreatePathDto) {
    try {
      return this.fetch(`/vertical/agbala/storyworlds/${storyworldId}/paths`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error('Failed to create path', error);
      throw error;
    }
  }

  async updatePath(pathId: string, dto: Partial<CreatePathDto>) {
    try {
      return this.fetch(`/vertical/agbala/paths/${pathId}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error(`Failed to update path ${pathId}`, error);
      throw error;
    }
  }

  async deletePath(pathId: string) {
    try {
      return this.fetch(`/vertical/agbala/paths/${pathId}`, { method: 'DELETE' });
    } catch (error) {
      this.logger.error(`Failed to delete path ${pathId}`, error);
      throw error;
    }
  }

  async getQuizzes(query: { storyworldId?: string; page?: number; limit?: number }) {
    try {
      const params = new URLSearchParams();
      if (query.storyworldId) params.set('storyworldId', query.storyworldId);
      if (query.page) params.set('page', query.page.toString());
      if (query.limit) params.set('limit', query.limit.toString());
      return this.fetch(`/vertical/agbala/quizzes?${params.toString()}`);
    } catch (error) {
      this.logger.error('Failed to fetch quizzes', error);
      throw error;
    }
  }

  async createQuiz(dto: CreateQuizDto) {
    try {
      return this.fetch('/vertical/agbala/quizzes', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error('Failed to create quiz', error);
      throw error;
    }
  }

  async deleteQuiz(quizId: string) {
    try {
      return this.fetch(`/vertical/agbala/quizzes/${quizId}`, { method: 'DELETE' });
    } catch (error) {
      this.logger.error(`Failed to delete quiz ${quizId}`, error);
      throw error;
    }
  }

  async getPendingReviews(query: { page?: number; limit?: number }) {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', query.page.toString());
      if (query.limit) params.set('limit', query.limit.toString());
      return this.fetch(`/vertical/agbala/moderation/review-queue?${params.toString()}`);
    } catch (error) {
      this.logger.error('Failed to fetch pending reviews', error);
      throw error;
    }
  }

  async approveContent(contentId: string) {
    try {
      return this.fetch(`/vertical/agbala/moderation/${contentId}/approve`, { method: 'POST' });
    } catch (error) {
      this.logger.error(`Failed to approve content ${contentId}`, error);
      throw error;
    }
  }

  async rejectContent(contentId: string, reason: string) {
    try {
      return this.fetch(`/vertical/agbala/moderation/${contentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    } catch (error) {
      this.logger.error(`Failed to reject content ${contentId}`, error);
      throw error;
    }
  }
}
