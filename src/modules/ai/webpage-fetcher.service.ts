import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

@Injectable()
export class WebpageFetcherService {
  private readonly logger = new Logger(WebpageFetcherService.name);

  async fetchAndExtract(url: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'URLShortenerBot/1.0 (AI Content Analysis)',
          Accept: 'text/html',
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        this.logger.warn(`Failed to fetch ${url}: HTTP ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        this.logger.warn(`Non-HTML content at ${url}: ${contentType}`);
        return null;
      }

      const html = await response.text();
      return this.extractText(html);
    } catch (error) {
      this.logger.warn(
        `Error fetching ${url}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      return null;
    }
  }

  private extractText(html: string): string {
    const $ = cheerio.load(html);

    $(
      'script, style, nav, footer, header, iframe, noscript, svg, form',
    ).remove();

    const title = $('title').text().trim();

    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() || '';
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    const combined = [
      title && `Title: ${title}`,
      metaDescription && `Description: ${metaDescription}`,
      bodyText,
    ]
      .filter(Boolean)
      .join('\n\n');

    return combined.slice(0, 4000);
  }
}
