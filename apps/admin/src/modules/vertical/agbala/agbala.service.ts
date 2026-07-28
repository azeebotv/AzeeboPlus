import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    return process.env.CONTENT_SERVICE_URL || 'http://content-service:3004';
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': process.env.INTERNAL_API_KEY || '',
    };
  }

  private async fetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers: { ...this.headers, ...(options?.headers || {}) },
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => 'Request failed');
      throw new Error(`HTTP ${res.status}: ${msg}`);
    }
    return res.json();
  }

  async getStoryworlds(query: { page?: number; limit?: number; search?: string }) {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', query.page.toString());
      if (query.limit) params.set('limit', query.limit.toString());
      if (query.search) params.set('search', query.search);
      return this.fetch(`/vertical/agbala/storyworlds?${params.toString()}`);
    } catch (error) {
      this.logger.error('Failed to fetch storyworlds', error);
      throw error;
    }
  }

  async getStoryworld(id: string) {
    try {
      return this.fetch(`/vertical/agbala/storyworlds/${id}`);
    } catch (error) {
      this.logger.error(`Failed to fetch storyworld ${id}`, error);
      throw new NotFoundException(`Storyworld ${id} not found`);
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
      return this.fetch(`/vertical/agbala/storyworlds/${storyworldId}/characters`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch (error) {
      this.logger.error('Failed to create character', error);
      throw error;
    }
  }

  async updateCharacter(characterId: string, dto: UpdateCharacterDto) {
    try {
      return this.fetch(`/vertical/agbala/characters/${characterId}`, {
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
      return this.fetch(`/vertical/agbala/storyworlds/${storyworldId}/characters`);
    } catch (error) {
      this.logger.error(`Failed to fetch characters for storyworld ${storyworldId}`, error);
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
