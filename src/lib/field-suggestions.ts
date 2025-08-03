interface FieldSuggestion {
  field: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
}

interface SuggestionContext {
  cvData: any;
  voiceData?: any;
  fieldName: string;
  section: string;
  index?: number;
}

export class FieldSuggestionEngine {
  /**
   * Generate AI-powered suggestions for missing or incomplete fields
   */
  static generateSuggestions(context: SuggestionContext): FieldSuggestion[] {
    const suggestions: FieldSuggestion[] = [];

    // Date field suggestions
    if (this.isDateField(context.fieldName)) {
      const dateSuggestion = this.suggestDate(context);
      if (dateSuggestion) suggestions.push(dateSuggestion);
    }

    // Location field suggestions
    if (this.isLocationField(context.fieldName)) {
      const locationSuggestion = this.suggestLocation(context);
      if (locationSuggestion) suggestions.push(locationSuggestion);
    }

    // Title/Role field suggestions
    if (this.isTitleField(context.fieldName)) {
      const titleSuggestion = this.suggestTitle(context);
      if (titleSuggestion) suggestions.push(titleSuggestion);
    }

    // Company field suggestions
    if (this.isCompanyField(context.fieldName)) {
      const companySuggestion = this.suggestCompany(context);
      if (companySuggestion) suggestions.push(companySuggestion);
    }

    return suggestions.filter((s) => s.confidence > 0.5);
  }

  private static isDateField(fieldName: string): boolean {
    return /date|from|to|start|end|year/i.test(fieldName);
  }

  private static isLocationField(fieldName: string): boolean {
    return /location|city|country|address/i.test(fieldName);
  }

  private static isTitleField(fieldName: string): boolean {
    return /title|role|position|job/i.test(fieldName);
  }

  private static isCompanyField(fieldName: string): boolean {
    return /company|organization|employer|firm/i.test(fieldName);
  }

  private static suggestDate(
    context: SuggestionContext
  ): FieldSuggestion | null {
    const { cvData, fieldName, section, index } = context;

    // If this is an end date and we have a start date, suggest current date if position is current
    if (
      fieldName.includes('end') &&
      section === 'workHistory' &&
      index !== undefined
    ) {
      const workItem = cvData.workHistory?.[index];
      if (workItem?.isCurrent) {
        return {
          field: fieldName,
          suggestion: 'Present',
          confidence: 0.9,
          reasoning: 'Position is marked as current',
        };
      }

      // Suggest a date based on typical job duration
      if (workItem?.startDate) {
        const startYear = this.extractYear(workItem.startDate);
        if (startYear) {
          const suggestedEndYear = startYear + 3; // Average job duration
          return {
            field: fieldName,
            suggestion: `${suggestedEndYear}`,
            confidence: 0.6,
            reasoning: 'Based on typical 3-year position duration',
          };
        }
      }
    }

    // If this is a start date and we know the person's career progression
    if (
      fieldName.includes('start') &&
      section === 'workHistory' &&
      index !== undefined
    ) {
      const workHistory = cvData.workHistory || [];
      if (workHistory.length > 1 && index > 0) {
        const previousJob = workHistory[index - 1];
        if (previousJob?.endDate) {
          const prevEndYear = this.extractYear(previousJob.endDate);
          if (prevEndYear) {
            return {
              field: fieldName,
              suggestion: `${prevEndYear + 1}`,
              confidence: 0.7,
              reasoning: 'Based on career progression timeline',
            };
          }
        }
      }
    }

    return null;
  }

  private static suggestLocation(
    context: SuggestionContext
  ): FieldSuggestion | null {
    const { cvData } = context;

    // Use existing location data if available
    if (cvData.location) {
      return {
        field: context.fieldName,
        suggestion: cvData.location,
        confidence: 0.8,
        reasoning: 'Based on profile location',
      };
    }

    // Look for location patterns in work history
    const workHistory = cvData.workHistory || [];
    const locations = workHistory
      .map((job: any) => job.location)
      .filter((loc: string) => loc)
      .slice(0, 3);

    if (locations.length > 0) {
      const mostCommon = this.getMostCommonValue(locations);
      return {
        field: context.fieldName,
        suggestion: mostCommon,
        confidence: 0.7,
        reasoning: 'Based on work history locations',
      };
    }

    return null;
  }

  private static suggestTitle(
    context: SuggestionContext
  ): FieldSuggestion | null {
    const { cvData, section, index } = context;

    // For work history, suggest based on career progression
    if (section === 'workHistory' && index !== undefined) {
      const workHistory = cvData.workHistory || [];

      // If this is the most recent position, use current role
      if (index === 0 && cvData.currentRole) {
        return {
          field: context.fieldName,
          suggestion: cvData.currentRole,
          confidence: 0.9,
          reasoning: 'Based on current role',
        };
      }

      // Suggest based on similar roles in history
      const similarTitles = workHistory
        .map((job: any) => job.title)
        .filter((title: string) => title && title !== '')
        .slice(0, 3);

      if (similarTitles.length > 0) {
        return {
          field: context.fieldName,
          suggestion: similarTitles[0],
          confidence: 0.6,
          reasoning: 'Based on similar roles in work history',
        };
      }
    }

    return null;
  }

  private static suggestCompany(
    context: SuggestionContext
  ): FieldSuggestion | null {
    const { cvData, section, index } = context;

    // For work history, suggest current company if this is the most recent role
    if (section === 'workHistory' && index === 0 && cvData.currentCompany) {
      return {
        field: context.fieldName,
        suggestion: cvData.currentCompany,
        confidence: 0.9,
        reasoning: 'Based on current company',
      };
    }

    return null;
  }

  private static extractYear(dateString: string): number | null {
    const yearMatch = dateString.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
  }

  private static getMostCommonValue(values: string[]): string {
    const counts: Record<string, number> = {};
    values.forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
  }

  /**
   * Generate smart suggestions for common missing fields
   */
  static getCommonMissingFields(data: any): Array<{
    field: string;
    section: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const missing: Array<{
      field: string;
      section: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // High priority missing fields
    if (!data.email)
      missing.push({ field: 'email', section: 'personal', priority: 'high' });
    if (!data.phone)
      missing.push({ field: 'phone', section: 'personal', priority: 'high' });
    if (!data.currentRole)
      missing.push({
        field: 'currentRole',
        section: 'professional',
        priority: 'high',
      });

    // Check work history for missing dates
    if (data.workHistory) {
      data.workHistory.forEach((job: any, index: number) => {
        if (!job.startDate) {
          missing.push({
            field: `workHistory[${index}].startDate`,
            section: 'workHistory',
            priority: 'medium',
          });
        }
        if (!job.endDate && !job.isCurrent) {
          missing.push({
            field: `workHistory[${index}].endDate`,
            section: 'workHistory',
            priority: 'medium',
          });
        }
      });
    }

    // Medium priority
    if (!data.location)
      missing.push({
        field: 'location',
        section: 'personal',
        priority: 'medium',
      });
    if (!data.professionalBio)
      missing.push({
        field: 'professionalBio',
        section: 'professional',
        priority: 'medium',
      });

    return missing;
  }
}

/**
 * Quick fill patterns for common field types
 */
export const QuickFillPatterns = {
  dates: {
    current: 'Present',
    recent: new Date().getFullYear().toString(),
    lastYear: (new Date().getFullYear() - 1).toString(),
    twoYearsAgo: (new Date().getFullYear() - 2).toString(),
  },

  durations: {
    shortTerm: '6 months - 1 year',
    mediumTerm: '2-3 years',
    longTerm: '4+ years',
    ongoing: 'Current position',
  },

  locations: {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
  },
};
