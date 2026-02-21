import { Injectable } from '@nestjs/common';
import {
  CATEGORIES,
  CategoryItem,
} from './constants/categories.constants';

@Injectable()
export class CategoriesService {
  findAll(): CategoryItem[] {
    return [...CATEGORIES];
  }

  /**
   * Returns the category name for a given age (at end of reference year).
   * Age must be computed externally (e.g. from birthDate + referenceYear).
   */
  getCategoryNameByAge(age: number): string {
    if (age < 0) return 'Invalid';
    return this.getCategoryNameByAgeFromList(age, CATEGORIES);
  }

  /**
   * Same as getCategoryNameByAge but using a preloaded list (e.g. for batch usage in dashboard).
   */
  getCategoryNameByAgeFromList(
    age: number,
    categories: CategoryItem[],
  ): string {
    if (age < 0) return 'Invalid';
    for (const cat of categories) {
      const inRange =
        age >= cat.minAge &&
        (cat.maxAge === null || age <= cat.maxAge);
      if (inRange) return cat.name;
    }
    return 'Invalid';
  }
}
