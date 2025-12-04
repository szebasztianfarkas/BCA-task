import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Book } from './books.entity';
import { BooksService } from './books.service';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  findAll(): Promise<Book[]> {
    return this.booksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Get('query/:country')
  async queryByCountryAndYear(
    @Param('country') country: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<Book[]> {
    console.log(to)
    console.log(from)
    const fromYear = from ? Number(from) : undefined;
    const toYear = to ? Number(to) : undefined;
    return this.booksService.findByAuthorCountryAndYear(country, fromYear, toYear);
  }

  @Patch('update-all-with-year')
  async updateAllWithYear() {
    return this.booksService.updateAllWithYear();
  }
}
