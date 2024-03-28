import { fetchFile, fetchApi } from '@libs/fetch';
import { FilterTypes, Filters } from '@libs/filterInputs';
import { Plugin } from '@typings/plugin';
import { NovelStatus } from '@libs/novelStatus';
import { defaultCover } from '@libs/defaultCover';
import { CheerioAPI, load as parseHTML } from 'cheerio';


class FWOPlugin implements Plugin.PluginBase {
  id = 'fwo';
  name = 'F-W-O';
  icon = 'src/en/fwo/icon.png';
  site = 'https://f-w-o.com';
  version = '1.0.0';

  parseNovels(loadedCheerio: CheerioAPI) {
    const novels: Plugin.NovelItem[] = [];

    loadedCheerio('.page-item-detail').each((i, el) => {
      const novelName = loadedCheerio(el).find('.post-title h3 a').text().trim();
      const novelCover = loadedCheerio(el).find('.item-thumb img').attr('src') || defaultCover;
      const novelUrl = loadedCheerio(el).find('.post-title h3 a').attr('href');

      if (!novelUrl) return;

      const novel = {
        name: novelName,
        cover: novelCover,
        path: novelUrl.replace(this.site, ''),
      };

      novels.push(novel);
    });

    return novels;
  }

  async popularNovels(
    pageNo: number,
    { filters }: Plugin.PopularNovelsOptions<Filters>,
  ): Promise<Plugin.NovelItem[]> {
    let url = `${this.site}/page/${pageNo}/`;

    if (filters.genre.value !== '') {
      url += `?genre=${filters.genre.value}`;
    }

    const body = await fetchApi(url).then(result => result.text());
    const loadedCheerio = parseHTML(body);
    return this.parseNovels(loadedCheerio);
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel> {
    const url = `${this.site}${novelPath}`;
    const body = await fetchApi(url).then(result => result.text());
    const $ = parseHTML(body);

    const novel: Plugin.SourceNovel = {
      path: novelPath,
      name: $('.post-title h1').text().trim(),
      cover: $('.summary_image img').attr('src') || defaultCover,
      author: $('.author-content a').text().trim(),
      genres: $('.genres-content a').map((i, el) => $(el).text().trim()).get().join(', '),
      status: $('.post-status .post-content_item').text().trim() === 'OnGoing' ? NovelStatus.Ongoing : NovelStatus.Completed,
      summary: $('.summary__content').text().trim(),
      chapters: [],
    };

    $('.wp-manga-chapter').each((i, el) => {
      const chapterName = $(el).find('a').text().trim();
      const chapterPath = $(el).find('a').attr('href')?.replace(this.site, '') || '';
      const chapterReleaseTime = $(el).find('.chapter-release-date i').text().trim();

      if (!novel.chapters) {
        novel.chapters = [];
      }

      novel.chapters.push({
        name: chapterName,
        path: chapterPath,
        releaseTime: chapterReleaseTime,
        chapterNumber: i + 1,
      });
    });


    return novel;
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = `${this.site}${chapterPath}`;
    const body = await fetchApi(url).then(result => result.text());
    const $ = parseHTML(body);

    $('.chapter-content script, .chapter-content .ads').remove();
    const chapterText = $('.chapter-content').html() || '';
    return chapterText;
  }

  async searchNovels(searchTerm: string, pageNo: number): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/page/${pageNo}/?s=${encodeURIComponent(searchTerm)}&post_type=wp-manga`;
    const body = await fetchApi(url).then(result => result.text());
    const loadedCheerio = parseHTML(body);
    return this.parseNovels(loadedCheerio);
  }

  async fetchImage(url: string): Promise<string | undefined> {
    return fetchFile(url);
  }

  filters = {
    genre: {
      label: 'Genre',
      value: '',
      options: [
        { label: 'All', value: '' },
        { label: 'Action', value: 'action' },
        { label: 'Adventure', value: 'adventure' },
        { label: 'Comedy', value: 'comedy' },
        { label: 'Drama', value: 'drama' },
        { label: 'Fantasy', value: 'fantasy' },
        { label: 'Harem', value: 'harem' },
        { label: 'Historical', value: 'historical' },
        { label: 'Horror', value: 'horror' },
        { label: 'Josei', value: 'josei' },
        { label: 'Martial Arts', value: 'martial-arts' },
        { label: 'Mature', value: 'mature' },
        { label: 'Mecha', value: 'mecha' },
        { label: 'Mystery', value: 'mystery' },
        { label: 'Psychological', value: 'psychological' },
        { label: 'Romance', value: 'romance' },
        { label: 'School Life', value: 'school-life' },
        { label: 'Sci-fi', value: 'sci-fi' },
        { label: 'Seinen', value: 'seinen' },
        { label: 'Shoujo', value: 'shoujo' },
        { label: 'Shounen', value: 'shounen' },
        { label: 'Slice of Life', value: 'slice-of-life' },
        { label: 'Sports', value: 'sports' },
        { label: 'Supernatural', value: 'supernatural' },
        { label: 'Tragedy', value: 'tragedy' },
        { label: 'Wuxia', value: 'wuxia' },
        { label: 'Xianxia', value: 'xianxia' },
        { label: 'Xuanhuan', value: 'xuanhuan' },
        { label: 'Yaoi', value: 'yaoi' },
        { label: 'Yuri', value: 'yuri' },
      ],
      type: FilterTypes.Picker,
    },
  } satisfies Filters;
}

export default new FWOPlugin();
