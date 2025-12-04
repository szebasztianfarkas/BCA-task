import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OpenLibraryClientService } from '../open-library/open-library-client.service';
import { Book } from './books.entity';

@Injectable()
export class BooksService {
  readonly DEFAULT_RELATIONS = ['authors'];

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly openLibraryClientService: OpenLibraryClientService,
  ) {}

  findAll(): Promise<Book[]> {
    return this.bookRepository.find({ relations: this.DEFAULT_RELATIONS });
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({
      relations: this.DEFAULT_RELATIONS,
      where: { id },
    });

    if (!book) throw new NotFoundException(`Book with id ${id} not found.`);

    return book;
  }

  async updateAllWithYear(): Promise<{ updated: number }> {
    const books = await this.bookRepository.find({
      where: { year: IsNull() },
    });;

    let updated = 0;

    for (const book of books) {
      if (!book.workId) {
        continue;
      }

      const work = await this.openLibraryClientService.getBookDetails(
        book.workId,
      );

      const year = this.extractYearFromWork(work);

      if (!year) {
        continue;
      }

      book.year = year;
      await this.bookRepository.save(book);
      updated++;
    }

    return { updated };
  }

  private extractYearFromWork(work: any): number | null {
    if (
      typeof work.first_publish_year === 'number' &&
      Number.isInteger(work.first_publish_year)
    ) {
      return work.first_publish_year;
    }

    if (typeof work.first_publish_date === 'string') {
      const match = work.first_publish_date.match(/\d{4}/);
      if (match) {
        const year = Number(match[0]);
        if (!Number.isNaN(year)) {
          return year;
        }
      }
    }

    return null;
  }

  async findByAuthorCountryAndYear(
    country: string,
    fromYear?: number,
    toYear?: number,
  ): Promise<Book[]> {
    const qb = this.bookRepository
      .createQueryBuilder('book')
      .innerJoinAndSelect('book.authors', 'author');

    qb.where('author.country = :country', { country });
    console.log(toYear)
    console.log(fromYear)
    if (fromYear !== undefined) {
      qb.andWhere('book.year >= :fromYear', { fromYear });
    }
    if (toYear !== undefined) {
      qb.andWhere('book.year <= :toYear', { toYear });
    }

    qb.orderBy('book.year', 'ASC');
    qb.distinct(true);

    return qb.getMany();
  }
}
