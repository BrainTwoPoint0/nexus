import { createClient } from './supabaseClient';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateEnhancedNexusScore,
  EnhancedNexusScoreResult,
  getEnhancedNexusScore,
} from './nexus-score';

export interface MatchingOptions {
  includeScores?: boolean;
  minScore?: number;
  maxResults?: number;
  forceRecalculate?: boolean;
}

export interface CandidateMatch {
  candidateId: string;
  jobId: string;
  score: EnhancedNexusScoreResult;
  candidate: {
    name: string;
    title: string;
    location: string;
    profileCompleteness: number;
  };
  job: {
    title: string;
    organization: string;
    sector: string;
    location: string;
  };
}

export interface JobMatch {
  jobId: string;
  candidateId: string;
  score: EnhancedNexusScoreResult;
  job: {
    title: string;
    organization: string;
    sector: string;
    location: string;
  };
  candidate: {
    name: string;
    title: string;
    location: string;
    profileCompleteness: number;
  };
}

export class MatchingService {
  private supabase: SupabaseClient;
  private cache: Map<string, EnhancedNexusScoreResult> = new Map();
  private cacheTimeout = 1000 * 60 * 30; // 30 minutes

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Get top job recommendations for a candidate
   */
  async getJobRecommendations(
    candidateId: string,
    options: MatchingOptions = {}
  ): Promise<JobMatch[]> {
    const {
      minScore = 50,
      maxResults = 10,
      forceRecalculate = false,
    } = options;

    try {
      // Get active jobs
      const { data: jobs, error: jobsError } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const matches: JobMatch[] = [];

      // Calculate or retrieve scores for each job
      for (const job of jobs) {
        try {
          let score: EnhancedNexusScoreResult | null = null;

          // Try to get cached/stored score first
          if (!forceRecalculate) {
            score = await this.getCachedScore(candidateId, job.id);
          }

          // Calculate new score if needed
          if (!score || forceRecalculate) {
            score = await this.calculateScore(candidateId, job.id);
          }

          // Add to matches if meets criteria
          if (score && score.overall_score >= minScore) {
            matches.push({
              jobId: job.id,
              candidateId,
              score,
              job: {
                title: job.title,
                organization: job.organization_name || 'Unknown',
                sector: job.sector || 'Unknown',
                location: job.location || 'Unknown',
              },
              candidate: {
                name: '', // Will be populated from candidate data
                title: '',
                location: '',
                profileCompleteness: 0,
              },
            });
          }
        } catch (error) {
          console.error(`Error calculating score for job ${job.id}:`, error);
          continue;
        }
      }

      // Sort by score and limit results
      matches.sort((a, b) => b.score.overall_score - a.score.overall_score);

      return matches.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  /**
   * Get top candidate recommendations for a job
   */
  async getCandidateRecommendations(
    jobId: string,
    options: MatchingOptions = {}
  ): Promise<CandidateMatch[]> {
    const {
      minScore = 50,
      maxResults = 20,
      forceRecalculate = false,
    } = options;

    try {
      // Get candidates with sufficient profile completeness
      const { data: candidates, error: candidatesError } = await this.supabase
        .from('profiles')
        .select('*')
        .gte('profile_completeness', 60)
        .order('last_profile_update', { ascending: false });

      if (candidatesError) throw candidatesError;

      const matches: CandidateMatch[] = [];

      // Calculate or retrieve scores for each candidate
      for (const candidate of candidates) {
        try {
          let score: EnhancedNexusScoreResult | null = null;

          // Try to get cached/stored score first
          if (!forceRecalculate) {
            score = await this.getCachedScore(candidate.id, jobId);
          }

          // Calculate new score if needed
          if (!score || forceRecalculate) {
            score = await this.calculateScore(candidate.id, jobId);
          }

          // Add to matches if meets criteria
          if (score && score.overall_score >= minScore) {
            matches.push({
              candidateId: candidate.id,
              jobId,
              score,
              candidate: {
                name: `${candidate.first_name} ${candidate.last_name}`,
                title: candidate.title || 'Professional',
                location: candidate.location || 'Unknown',
                profileCompleteness: candidate.profile_completeness || 0,
              },
              job: {
                title: '', // Will be populated from job data
                organization: '',
                sector: '',
                location: '',
              },
            });
          }
        } catch (error) {
          console.error(
            `Error calculating score for candidate ${candidate.id}:`,
            error
          );
          continue;
        }
      }

      // Sort by score and limit results
      matches.sort((a, b) => b.score.overall_score - a.score.overall_score);

      return matches.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting candidate recommendations:', error);
      throw error;
    }
  }

  /**
   * Batch calculate scores for multiple candidate-job pairs
   */
  async batchCalculateScores(
    pairs: Array<{ candidateId: string; jobId: string }>
  ): Promise<
    Array<{
      candidateId: string;
      jobId: string;
      score: EnhancedNexusScoreResult | null;
      error?: string;
    }>
  > {
    const results: Array<{
      candidateId: string;
      jobId: string;
      score: EnhancedNexusScoreResult | null;
      error?: string;
    }> = [];

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);

      const batchPromises = batch.map(async (pair) => {
        try {
          const score = await this.calculateScore(pair.candidateId, pair.jobId);
          return {
            candidateId: pair.candidateId,
            jobId: pair.jobId,
            score,
          };
        } catch (error) {
          return {
            candidateId: pair.candidateId,
            jobId: pair.jobId,
            score: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch calculation error:', result.reason);
        }
      });

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < pairs.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Update all scores for a candidate (when their profile changes)
   */
  async updateCandidateScores(candidateId: string): Promise<void> {
    try {
      // Get all active jobs
      const { data: jobs, error: jobsError } = await this.supabase
        .from('jobs')
        .select('id')
        .eq('status', 'active');

      if (jobsError) throw jobsError;

      // Create pairs for batch processing
      const pairs = jobs.map((job) => ({
        candidateId,
        jobId: job.id,
      }));

      // Batch calculate scores
      await this.batchCalculateScores(pairs);
    } catch (error) {
      console.error('Error updating candidate scores:', error);
      throw error;
    }
  }

  /**
   * Update all scores for a job (when job details change)
   */
  async updateJobScores(jobId: string): Promise<void> {
    try {
      // Get all candidates with sufficient profile completeness
      const { data: candidates, error: candidatesError } = await this.supabase
        .from('profiles')
        .select('id')
        .gte('profile_completeness', 60);

      if (candidatesError) throw candidatesError;

      // Create pairs for batch processing
      const pairs = candidates.map((candidate) => ({
        candidateId: candidate.id,
        jobId,
      }));

      // Batch calculate scores
      await this.batchCalculateScores(pairs);
    } catch (error) {
      console.error('Error updating job scores:', error);
      throw error;
    }
  }

  /**
   * Get cached score or calculate new one
   */
  private async getCachedScore(
    candidateId: string,
    jobId: string
  ): Promise<EnhancedNexusScoreResult | null> {
    const cacheKey = `${candidateId}-${jobId}`;

    // Check memory cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }

    // Check database cache
    const score = await getEnhancedNexusScore(candidateId, jobId);

    if (score) {
      // Add to memory cache
      this.cache.set(cacheKey, score);

      // Clean up old cache entries
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);
    }

    return score;
  }

  /**
   * Calculate new score and cache it
   */
  private async calculateScore(
    candidateId: string,
    jobId: string
  ): Promise<EnhancedNexusScoreResult> {
    const score = await calculateEnhancedNexusScore(
      candidateId,
      jobId,
      this.supabase
    );

    // Cache the result
    const cacheKey = `${candidateId}-${jobId}`;
    this.cache.set(cacheKey, score);

    // Clean up old cache entries
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.cacheTimeout);

    return score;
  }

  /**
   * Get matching analytics for a candidate
   */
  async getCandidateAnalytics(candidateId: string): Promise<{
    totalMatches: number;
    averageScore: number;
    topScore: number;
    scoreDistribution: {
      excellent: number; // 90-100
      good: number; // 70-89
      fair: number; // 50-69
      poor: number; // 0-49
    };
    topSectors: Array<{ sector: string; count: number; avgScore: number }>;
  }> {
    try {
      const { data: scores, error } = await this.supabase
        .from('nexus_scores')
        .select(
          `
          overall_score,
          jobs (sector)
        `
        )
        .eq('candidate_id', candidateId)
        .gte('overall_score', 0);

      if (error) throw error;

      const totalMatches = scores.length;
      const averageScore =
        scores.reduce((sum, s) => sum + s.overall_score, 0) / totalMatches;
      const topScore = Math.max(...scores.map((s) => s.overall_score));

      const scoreDistribution = {
        excellent: scores.filter((s) => s.overall_score >= 90).length,
        good: scores.filter(
          (s) => s.overall_score >= 70 && s.overall_score < 90
        ).length,
        fair: scores.filter(
          (s) => s.overall_score >= 50 && s.overall_score < 70
        ).length,
        poor: scores.filter((s) => s.overall_score < 50).length,
      };

      // Calculate top sectors
      const sectorStats = new Map<
        string,
        { count: number; totalScore: number }
      >();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scores.forEach((score: any) => {
        const sector = score.jobs?.sector || 'Unknown';
        const existing = sectorStats.get(sector) || { count: 0, totalScore: 0 };
        sectorStats.set(sector, {
          count: existing.count + 1,
          totalScore: existing.totalScore + score.overall_score,
        });
      });

      const topSectors = Array.from(sectorStats.entries())
        .map(([sector, stats]) => ({
          sector,
          count: stats.count,
          avgScore: Math.round(stats.totalScore / stats.count),
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      return {
        totalMatches,
        averageScore: Math.round(averageScore),
        topScore,
        scoreDistribution,
        topSectors,
      };
    } catch (error) {
      console.error('Error getting candidate analytics:', error);
      throw error;
    }
  }

  /**
   * Get matching analytics for a job
   */
  async getJobAnalytics(jobId: string): Promise<{
    totalCandidates: number;
    averageScore: number;
    topScore: number;
    scoreDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    averageProfileCompleteness: number;
    boardExperienceStats: {
      withExperience: number;
      averageWeight: number;
    };
  }> {
    try {
      const { data: scores, error } = await this.supabase
        .from('nexus_scores')
        .select(
          `
          overall_score,
          board_experience_weight,
          profiles!inner (profile_completeness)
        `
        )
        .eq('job_id', jobId)
        .gte('overall_score', 0);

      if (error) throw error;

      const totalCandidates = scores.length;
      const averageScore =
        scores.reduce((sum, s) => sum + s.overall_score, 0) / totalCandidates;
      const topScore = Math.max(...scores.map((s) => s.overall_score));

      const scoreDistribution = {
        excellent: scores.filter((s) => s.overall_score >= 90).length,
        good: scores.filter(
          (s) => s.overall_score >= 70 && s.overall_score < 90
        ).length,
        fair: scores.filter(
          (s) => s.overall_score >= 50 && s.overall_score < 70
        ).length,
        poor: scores.filter((s) => s.overall_score < 50).length,
      };

      const averageProfileCompleteness = Math.round(
        scores.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum, s: any) => sum + (s.profiles?.profile_completeness || 0),
          0
        ) / totalCandidates
      );

      const boardExperienceStats = {
        withExperience: scores.filter(
          (s) => (s.board_experience_weight || 0) > 0
        ).length,
        averageWeight:
          scores.reduce((sum, s) => sum + (s.board_experience_weight || 0), 0) /
          totalCandidates,
      };

      return {
        totalCandidates,
        averageScore: Math.round(averageScore),
        topScore,
        scoreDistribution,
        averageProfileCompleteness,
        boardExperienceStats,
      };
    } catch (error) {
      console.error('Error getting job analytics:', error);
      throw error;
    }
  }

  /**
   * Clear all cached scores
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: 1000, // Could be configurable
    };
  }
}

// Export singleton instance
export const matchingService = new MatchingService();

// Export utility functions
export async function getTopJobsForCandidate(
  candidateId: string,
  limit: number = 10
): Promise<JobMatch[]> {
  return matchingService.getJobRecommendations(candidateId, {
    maxResults: limit,
  });
}

export async function getTopCandidatesForJob(
  jobId: string,
  limit: number = 20
): Promise<CandidateMatch[]> {
  return matchingService.getCandidateRecommendations(jobId, {
    maxResults: limit,
  });
}

export async function refreshScoresForCandidate(
  candidateId: string
): Promise<void> {
  return matchingService.updateCandidateScores(candidateId);
}

export async function refreshScoresForJob(jobId: string): Promise<void> {
  return matchingService.updateJobScores(jobId);
}
