import { Injectable } from '@nestjs/common';

/**
 * ACDP (Age, Content Descriptor, Parental) Validation (AZP-CMS-004)
 *
 * Validates content metadata against platform content descriptors
 * before publishing. Ensures content is properly classified for
 * age-gating and parental controls.
 */

export interface ACDPField {
  field: string;
  value: unknown;
  required: boolean;
}

export interface ACDPValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  classification?: {
    ageRating: string;
    contentDescriptors: string[];
    parentalAdvisory: boolean;
  };
}

const AGE_RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', '18+'];

const CONTENT_DESCRIPTORS = [
  'violence',
  'language',
  'sexual-content',
  'drug-use',
  'nudity',
  'frightening-scenes',
  'mature-themes',
  'discrimination',
  'gambling',
  'smoking',
];

const REQUIRED_FIELDS = ['title', 'description', 'thumbnail', 'universeId'];

@Injectable()
export class ACDPValidationService {
  /**
   * Validate content metadata against ACDP requirements.
   */
  validateContentMetadata(content: Record<string, unknown>): ACDPValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!content[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate title length
    const title = content.title as string;
    if (title) {
      if (title.length < 3) {
        errors.push('Title must be at least 3 characters');
      }
      if (title.length > 200) {
        errors.push('Title must not exceed 200 characters');
      }
    }

    // Validate description
    const description = content.description as string;
    if (description) {
      if (description.length > 2000) {
        warnings.push('Description exceeds recommended length of 2000 characters');
      }
    }

    // Validate metadata age rating if present
    const metadata = (content.metadata as Record<string, unknown>) || {};
    const ageRating = metadata.ageRating as string;
    if (ageRating && !AGE_RATINGS.includes(ageRating)) {
      errors.push(`Invalid age rating: ${ageRating}. Must be one of: ${AGE_RATINGS.join(', ')}`);
    }

    // Validate content descriptors
    const descriptors = metadata.contentDescriptors as string[] | undefined;
    if (descriptors) {
      for (const desc of descriptors) {
        if (!CONTENT_DESCRIPTORS.includes(desc)) {
          warnings.push(`Unknown content descriptor: ${desc}`);
        }
      }
    }

    // Flag content with mature themes but no age rating
    if (
      descriptors?.some((d) => ['violence', 'sexual-content', 'drug-use', 'nudity'].includes(d)) &&
      !ageRating
    ) {
      warnings.push('Content has mature descriptors but no age rating — will default to PG-13');
    }

    // Build classification
    const classification = ageRating
      ? {
          ageRating,
          contentDescriptors: descriptors || [],
          parentalAdvisory: ageRating === 'R' || ageRating === 'NC-17' || ageRating === '18+',
        }
      : undefined;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      classification,
    };
  }

  /**
   * Validate that content is appropriate for its target universe.
   */
  validateUniverseFit(
    content: Record<string, unknown>,
    universeName: string
  ): ACDPValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const metadata = (content.metadata as Record<string, unknown>) || {};
    const ageRating = metadata.ageRating as string;

    // Universe-specific age rating minimums
    const universeMinRatings: Record<string, string> = {
      comedy: 'PG',
      games: 'PG',
      lifestyle: 'G',
    };

    const minRating = universeMinRatings[universeName];
    if (minRating && ageRating) {
      const minIndex = AGE_RATINGS.indexOf(minRating);
      const contentIndex = AGE_RATINGS.indexOf(ageRating);
      if (contentIndex < minIndex) {
        errors.push(
          `Content rating ${ageRating} is below minimum ${minRating} for ${universeName} universe`
        );
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
