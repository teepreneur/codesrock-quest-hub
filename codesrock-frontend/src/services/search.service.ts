import { apiService } from './api.service';

export interface SearchResult {
  topics: any[];
  resources: any[];
  query: string;
}

class SearchService {
  /**
   * Unified search across topics and resources
   */
  async search(query: string): Promise<SearchResult> {
    return apiService.get<SearchResult>(`/search?q=${encodeURIComponent(query)}`);
  }
}

export const searchService = new SearchService();
